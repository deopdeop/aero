require "http/server"
require "socket"
require "yaml"

config = YAML.parse(File.read("config.yaml"))

macro rewrite_uri(url)
  "#{context.request.headers["host"]}/#{{{url}}}"
end

http = HTTP::Server.new do |context|
  if context.request.path === "/sw.js"
    context.response.headers["Content-Type"] = "application/javascript"
    context.response.print File.read("./rewrite.js") + File.read("sw.js")
    next
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

  HTTP::Client.get(request_uri, request_headers) do |response|
    cors = HTTP::Headers.new
    response.headers.each do |key, value|
      case key
      when "Access-Control-Allow-Credentials" || "Access-Control-Allow-Origin" || "Alt-Svc" || "Cache-Control" || "Content-Encoding" || "Content-Length" || "Content-Security-Policy" || "Cross-Origin-Resource-Policy" || "Permissions-Policy" || "Service-Worker-Allowed" || "Strict-Transport-Security" || "Timing-Allow-Origin" || "X-Frame-Options" || "X-XSS-Protection"
        cors[key] = value
      when "Set-Cookie" || "Set-Cookie2"
        # TODO: Rewrite cookie
      when "Location"
        context.response.headers[key] = "http://#{rewrite_uri(value.first)}"
      else
        context.response.headers[key] = value
      end
    end
    context.response.headers.add("Service-Worker-Allowed", "/")

    context.response.status_code = response.status_code

    p cors

    case response.headers["content-type"].split(';').first
    when "text/html" || "text/x-html"
      body = "
<head>
<!-- Reset favicon -->
<link href=\"data:image/x-icon;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQEAYAAABPYyMiAAAABmJLR0T///////8JWPfcAAAACXBIWXMAAABIAAAASABGyWs+AAAAF0lEQVRIx2NgGAWjYBSMglEwCkbBSAcACBAAAeaR9cIAAAAASUVORK5CYII=\" rel=\"icon\" type=\"image/x-icon\" />
</head>
<body>
  <script>
    #{File.read("./rewrite.js")}

    let context = {
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
{
  window.document.scripts = _window.document.scripts;
  _window = undefined;
        
  #{body}
}
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

ws = HTTP::WebSocketHandler.new do |ws, context|
  ws = HTTP::WebSocket.new(context.request.path.lchop('/'), context.request.headers)
    
  ws.on_message do |message|
    ws.send message
  end
  
  ws.run
end

server = HTTP::Server.new([
  http,
  ws
]).listen(config.port)
