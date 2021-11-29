require "http/server/handler"
require "uri"
require "json"
require "base64"
require "regex"

class HTTPHandler
  include HTTP::Handler

  def call(context)
    rewrite = "
let rewrite = {
  url: url => /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/gm.test(url) ? `${location.origin}/${url}` : `${location.origin}/${ctx.url.origin}${url}`,
  js: body => `
(function (window, globalThis.window) {
  ${body}
}(_window, undefined)
  `
};
    "

    if context.request.path === "/sw.js"
      context.response.headers["Content-Type"] = "application/javascript"
      context.response.print rewrite + File.read("sw.js")
      # next
    end
    
    request_uri = URI.parse(context.request.path.lchop('/'))

    request_headers = HTTP::Headers.new
    context.request.headers.each do |key, value|
      case key
      when "Accept-Encoding" || "Cache-Control" || "Sec-Fetch-Site" || "Service-Worker" || "X-Forwarded-For" || "X-Forwarded-Host"
      when "Host"
        p value
        request_headers[key] = request_uri.host.not_nil!
      when "Referer"
        # TODO: Unescape url
      else
        request_headers[key] = value
      end
    end

    HTTP::Client.get(request_uri, request_headers) do |response|
      cors = HTTP::Headers.new
      response.headers.each do |key, value|
        # TODO: Don't remove Strict-Transport-Security if running ssl
        # TODO: Rewrite Alt-Svc instead of deleting it
        # TODO: Use switch statement instead
        if key.in? "Access-Control-Allow-Credentials", "Access-Control-Allow-Origin", "Alt-Svc", "Content-Encoding", "Content-Length", "Content-Security-Policy", "Cross-Origin-Resource-Policy", "Permissions-Policy", "Service-Worker-Allowed", "Strict-Transport-Security", "Timing-Allow-Origin", "X-Frame-Options", "X-XSS-Protection"
          cors[key] = value
          # This was next
        elsif key.in? "Set-Cookie", "Set-Cookie2"
          # TODO: Rewrite cookie
        elsif key == "Location"
          context.response.headers[key] = "http://#{rewrite_uri(value.first)}"
        else
          context.response.headers[key] = value
        end
      end
      # TODO: Now that it has been changed, emulate this in js
      context.response.headers.add("Service-Worker-Allowed", "/")

      p response.headers

      context.response.status_code = response.status_code
    
      case response.headers["content-type"].split(';').first
      when "text/html" || "text/x-html"
        # TODO: If debug mode read file real time or else read in compile time
        body = "
<script>
#{rewrite}
    
let ctx = {
  cors: #{cors.to_json},
  url: new URL('#{request_uri}')
};
    
#{File.read("./index.js")}
    
document.write(atob('#{Base64.strict_encode(response.body_io.gets_to_end)}'));
</script>
      "
      when "application/javascript" || "application/x-javascript" || "text/javascript"
        # TODO: Implement yoct's amazing regex
        body = "
(function (window, _window) {
  #{response.body_io.gets_to_end}
}(_window, undefined);
          "
      when "application/manifest+json"
        json = JSON.parse(response.body)
        # TODO: Rewrite
        body = json.to_json
      else
        body = response.body_io.gets_to_end
      end
      context.response.print body
    end
  end
end