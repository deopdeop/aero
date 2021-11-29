require "http/server/handler"

class WSHandler
  # Why won't this work :(
  include HTTP::WebSocketHandler

  def call(ws, context)
    ws = HTTP::WebSocket.new(context.request.path.lchop('/'), context.request.headers)
  
    ws.on_message do |message|
      ws.send message
    end
  
    ws.run
  end
end