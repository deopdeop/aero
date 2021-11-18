require "http/server"
require "http/client"
require "socket"
require "openssl"

require "proxy"

server = HTTP::Server.new([
  HTTP::StaticFileHandler.new("./static"),
  http,
  ws,
])

socket = OpenSSL::SSL::Context::Server.new
socket.certificate_chain = "ssl/public.crt"
socket.private_key = "ssl/private.key"

server.bind_tls "127.0.0.1", ARGV[0], socket
