require "http/server/handler"
require "uri"
require "json"
require "base64"
require "regex"

# TODO: Move back to main.cr
class HTTPHandler
  include HTTP::Handler

  def call(context)
    if context.request.path === "/sw.js"
      context.response.headers["Content-Type"] = "application/javascript"
      context.response.print File.read("./rewrite.js") + File.read("sw.js")
      return
    end
    
    request_uri = URI.parse(context.request.path.lchop('/'))

    request_headers = HTTP::Headers.new
    context.request.headers.each do |key, value|
      case key
      when "Accept-Encoding" || "Cache-Control" || "Sec-Fetch-Site" || "Service-Worker" || "X-Forwarded-For" || "X-Forwarded-Host"
      when "Host"
        request_headers[key] = request_uri.host.not_nil!
      when "Referrer"
        # TODO: Unescape url
      else
        request_headers[key] = value
      end
    end

    p request_headers

    HTTP::Client.get(request_uri, request_headers) do |response|
      cors = HTTP::Headers.new
      response.headers.each do |key, value|
        # TODO: Convert to switch statement
        if key.in? "Access-Control-Allow-Credentials", "Access-Control-Allow-Origin", "Alt-Svc", "Cache-Control", "Content-Encoding", "Content-Length", "Content-Security-Policy", "Cross-Origin-Resource-Policy", "Permissions-Policy", "Service-Worker-Allowed", "Strict-Transport-Security", "Timing-Allow-Origin", "X-Frame-Options", "X-XSS-Protection"
          cors[key] = value
        elsif key.in? "Set-Cookie", "Set-Cookie2"
          # TODO: Rewrite cookie
        elsif key == "Location"
          context.response.headers[key] = "http://#{rewrite_uri(value.first)}"
        else
          context.response.headers[key] = value
        end
      end
      context.response.headers.add("Service-Worker-Allowed", "/")
      context.response.headers.add("Access-Control-Allow-Origin", "*")

      context.response.status_code = response.status_code
    
      case response.headers["content-type"].split(';').first
      when "text/html" || "text/x-html"
        body = "
<body>
<script>
#{File.read("./rewrite.js")}
    
let ctx = {
  body: atob('#{Base64.strict_encode(response.body_io.gets_to_end)}'),
  cors: #{cors.to_json},
  url: new URL('#{request_uri}')
};
    
#{File.read("./index.js")}
</script>
</body>
      "
      when "application/javascript" || "application/x-javascript" || "text/javascript"
        body = "
(function (window.document.scripts, observerCallback, _window) {
  #{response.body_io.gets_to_end}
}(_window.document.scripts, undefined, undefined)
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