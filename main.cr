require "http"
require "socket"
require "uri"
require "json"
require "base64"
require "regex"

macro rewrite_uri(url)
  "#{context.request.headers["host"]}/#{{{url}}}"
end

def rewrite_request_headers(headers)
  new_headers = HTTP::Headers.new
  headers.each do |key, value|
    case key
    when "Host"
      p value
      new_headers[key] = request_uri.host.not_nil!
    when "Referer"
      new_headers[key] = rewrite_uri(value)
    else
      new_headers[key] = value
    end
  end
  return new_headers
end

def http(context)
  rewrite = "
let rewrite = {
  url: url => /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/gm.test(url) ? `${location.origin}/${url}` : `${location.origin}/${ctx.url.origin}${url}`;
  js: body => `
(function (window, globalThis.window) {
  ${body}
}(_window, undefined);
  `
};
  "

  if context.request.path === "/sw.js"
    context.response.headers["Content-Type"] = "application/javascript"
    context.response.print rewrite + File.read("sw.js")
    next
  end

  request_uri = URI.parse(context.request.path.lchop('/'))
  
  HTTP::Client.get(request_uri, rewrite_request_headers(context.request.headers)) do |response|
    cors = HTTP::Headers.new
    # TODO: Standard compliance
    response.headers.each do |key, value|
      # TODO: Don't remove Strict-Transport-Security if running ssl
      # TODO: Rewrite Alt-Svc instead of deleting it
      if key.in? "Access-Control-Allow-Credentials", "Access-Control-Allow-Origin", "Alt-Svc", "Content-Encoding", "Content-Length", "Content-Security-Policy", "Cross-Origin-Resource-Policy", "Permissions-Policy", "Strict-Transport-Security", "Timing-Allow-Origin", "X-Frame-Options", "X-XSS-Protection"
        p "Deleting #{key}"
        cors[key] = value
        next
      end
      if key.in? "Set-Cookie", "Set-Cookie2"
        # TODO: Rewrite cookie
      elsif key == "Location"
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
      # TODO: Implement yoct's amazing regex
      body = "
(function (window, globalThis.window) {
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

ws = HTTP::WebSocketHandler.new do |ws, context|
  ws = HTTP::WebSocket.new(context.request.path.lchop('/'), rewrite_request_headers(context.request.headers))

  ws.on_message do |message|
    ws.send msg
  end

  ws.run
end

webrtc = TCPServer.new("localhost", true)
while server = webrtc.accept?
  spawn do |server|
    client = TCPSocket.new(socket.remote_address.address, socket.remote_address.port)
    message = server.gets
    # TODO: Rewrite message
    p message
    client.puts = message
    server.puts = client.gets
    client.close
  end
end

server = HTTP::Server.new([
  http,
  ws
])

server.bind(webrtc)

# TODO: Support SSL
server.bind_tcp "localhost", 8080
server.listen
