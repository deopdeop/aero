require "http/server"
require "socket"

require "./http.cr"
#require "./ws.cr"

macro rewrite_uri(url)
  "#{context.request.headers["host"]}/#{{{url}}}"
end

#def handle_connection(conn)
#  client = TCPSocket.new(conn.remote_address.address, conn.remote_address.port)
#  message = conn.gets
#  # TODO: Rewrite message
#  p message
#  client.puts message
#  conn.puts client.gets
#  client.close
#end

#webrtc = TCPServer.new("localhost", 8080, 1, nil, true)
#while conn = webrtc.accept?
#  spawn handle_connection(conn)
#end

server = HTTP::Server.new([
  HTTPHandler.new,
#  WSHandler.new,
])

#server.bind(webrtc)

server.bind_tcp "localhost", 8080
server.listen
