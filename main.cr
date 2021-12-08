require "http/server"
require "socket"
require "uri"
require "json"
require "yaml"

# FIXME: config.path is undefined
config = YAML.parse(File.read("./config.yaml"))

macro rewrite_uri(url)
  "#{context.request.headers["host"]}/#{{{url}}}"
end

ws = HTTP::WebSocketHandler.new do |ws, context|
  ws = HTTP::WebSocket.new(context.request.path.lchop('/'), context.request.headers)

  ws.on_message do |message|
    ws.send message
  end

  ws.run
end

server = HTTP::Server.new([
  # HTTP::StaticFileHandler.new("./static", true, true),
  ws,
]) do |context|
  request_uri = URI.parse(URI.decode(context.request.path.lchop('/')))

  request_headers = HTTP::Headers.new
  context.request.headers.each do |key, value|
    case key
    # TODO: Only delete the Service-Worker if the service worker isn't the interceptor
    when "Accept-Encoding" || "Cache-Control" || "Service-Worker" || "X-Forwarded-For" || "X-Forwarded-Host"
    when "Host"
      request_headers[key] = request_uri.host.not_nil!
    when "Referrer"
      request_headers[key] = request_headers["_Referrer"]
    else
      request_headers[key] = value
    end
  end

  HTTP::Client.get(request_uri, request_headers) do |response|
    cors = HTTP::Headers.new
    response.headers.each do |key, value|
      case key
      when "Access-Control-Allow-Origin" || "Alt-Svc" || "Cache-Control" || "Content-Encoding" || "Content-Length" || "Content-Security-Policy" || "Cross-Origin-Resource-Policy" || "Permissions-Policy" || "Set-Cookie" || "Set-Cookie2" || "Service-Worker-Allowed" || "Strict-Transport-Security" || "Timing-Allow-Origin" || "X-Frame-Options" || "X-XSS-Protection"
        cors[key] = value
      when "Location"
        context.response.headers[key] = "http://#{rewrite_uri(value.first)}"
      else
        context.response.headers[key] = value
      end
    end
    # Don't let any requests escape origin
    context.response.headers.add("Cross-Origin-Opener-Policy", "same-origin-allow-popups")
    context.response.headers.add("Cross-Origin-Embedder-Policy", "require-corp")
    context.response.headers.add("Cross-Origin-Resource-Policy", "same-origin")
    context.response.headers.add("Service-Worker-Allowed", "/")

    context.response.status_code = response.status_code

    case response.headers["content-type"].split(';').first
    when "text/html" || "text/x-html"
      body = <<-HTML
        <!DOCTYPE html>
        <html>
          <head>
            <!-- Reset favicon -->
            <link href="data:image/x-icon;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQEAYAAABPYyMiAAAABmJLR0T///////8JWPfcAAAACXBIWXMAAABIAAAASABGyWs+AAAAF0lEQVRIx2NgGAWjYBSMglEwCkbBSAcACBAAAeaR9cIAAAAASUVORK5CYII=" rel="icon" type="image/x-icon"/> 
            <link rel="manifest" href=".appmanifest"/>
          </head>
          <body>
            <script>
              let context = {
                body: atob('#{Base64.strict_encode(response.body_io.gets_to_end)}'),
                cors: {
                  #{cors.to_json}
                },
                url: new URL('#{request_uri}')
              };

              #{File.read("index.js")}
            </script>
          </body>
        </html>
      HTML
    when "application/javascript" || "application/x-javascript" || "text/javascript"
      body = <<-JS
        {
          _window = undefined;

          #{response.body_io.gets_to_end}
        }
      JS
    else
      body = response.body_io.gets_to_end
    end
    context.response << body
  end
end

server.listen(3000)
