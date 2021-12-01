require "http/server"
require "socket"
require "yaml"

require "./http.cr"

config = YAML.parse({{read_file("config.yaml")}})

macro rewrite_uri(url)
  "#{ctx.request.headers["host"]}/#{{{url}}}"
end

wrtc = TCPServer.new(8080, 1, nil, true)
while conn = webrtc.accept?
  spawn do |conn|
    client = TCPSocket.new(conn.remote_address.address, conn.remote_address.port)
    msg = conn.gets
    # TODO: Rewrite message
    p sg
    client.puts msg
    conn.puts client.gets
    client.close
  end
end

ws = HTTP::WebSocketHandler.new do |ws, ctx|
  ws = HTTP::WebSocket.new(ctx.request.path.lchop('/'), ctx.request.headers)
  
  ws.on_message do |msg|
    ws.send msg
  end

  ws.run
end

server = HTTP::Server.new([
  HTTPHandler.new,
  ws
])

server.bind(wrtc)
