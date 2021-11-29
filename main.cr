require "http"
require "uri"
require "json"
require "base64"
require "regex"

macro rewrite_uri(url)
  "#{context.request.headers["host"]}/#{{{url}}}"
end

http = HTTP::Server.new do |context|
  rewrite = "
let rewrite = {
  url: str => /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/gm.test(str) ? `${location.origin}/${str}` : `${location.origin}/${ctx.url.origin}${str}`;
};
  "

  if context.request.path === "/sw.js"
    context.response.headers["Content-Type"] = "application/javascript"
    context.response.print rewrite + File.read("sw.js")
    next
  end

  request_uri = URI.parse(context.request.path.lchop('/'))
  
  request_headers = HTTP::Headers.new
  context.request.headers.each do |key, value|
    case key
    when "Host"
      p request_uri.host
      request_headers[key] = request_uri.host.not_nil!
    when "Referer"
      request_headers[key] = rewrite_uri(value)
    when "Accept-Encoding"
    else
      request_headers[key] = value
    end
  end 

  p request_headers

  HTTP::Client.get(request_uri, request_headers) do |response|
    cors = HTTP::Headers.new
    # TODO: Standard compliancy
    response.headers.each do |key, value|
      # TODO: Don't remove Strict-Transport-Security if running ssl
      # TODO: Rewrite Alt-Svc instead of deleting it
      if key.in? "Access-Control-Allow-Credentials", "Access-Control-Allow-Origin", "Alt-Svc", "Content-Encoding", "Content-Length", "Content-Security-Policy", "Cross-Origin-Resource-Policy", "Strict-Transport-Security", "Timing-Allow-Origin", "X-Frame-Options", "X-XSS-Protection"
        p "Deleting #{key}"
        cors[key] = value
        next
      end
      if key.in? "Set-Cookie", "Set-Cookie2"
        # TODO: Rewrite.
      elsif key === "Location"
        context.response.headers[key] = "http://#{rewrite_uri(value.first)}"
      else
        p "Keeping #{key}"
        context.response.headers[key] = value
      end
    end

    context.response.status_code = response.status_code

    case response.headers["content-type"].split(';').first
    when "text/html" || "text/x-html"
      p cors.to_json
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
      # TODO: Move all imports outside of self invoking function and redirect path to /import with regex this should fix sites like bread boy's when it loading three js, same on the browser too.
      body = "
(function (window) {
  #{response.body_io.gets_to_end}
}({ window, ...globalThis.window }));
      "
    when "application/manifest+json"
      json = JSON.parse(response.body)
      # TODO: Rewrite.
      body = json.to_json
    else
      body = response.body_io.gets_to_end
    end
    context.response.print body
  end
end

ws = HTTP::WebSocketHandler.new do |ws, context|
  # TODO: Proxy.
  ws.on_ping { ws.pong context.request.path }
end

http.bind_tcp "127.0.0.1", 8080
http.listen
