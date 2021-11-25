require "http"
require "uri"
require "json"
require "base64"

macro rewrite_url(url)
  "#{context.request.headers["host"]}/#{{{url}}}"
  {% debug %}
end

http = HTTP::Server.new do |context|
  request_uri = URI.parse(context.request.path.lchop('/'))
  
  request_headers = HTTP::Headers.new
  context.request.headers.each do |key, value|
    case key
    when "host"
      #request_headers[key] = request_uri.host 
    when "location" || "referer"
      #request_headers[key] = rewrite_url(value)
    else
      #request_headers[key] = value
    end
  end 
  
  # Use this instead
  #HTTP::Client.options(request_uri.to_s, {headers: request_headers}) do |response|
  HTTP::Client.get("https://luphoria.com") do |response|
    cors = HTTP::Headers.new
    #response.headers.each do |key, value|
    #  if key.in? "content-encoding", "timing-allow-origin", "x-frame-options"
    #    cors[key] = value
    #    next
    #  end
    #  request.response.headers[key] = value
    #end

    context.response.status_code = response.status_code

    body = response.body
    case response.headers["content-type"].split(';').first?
    when "text/html" || "text/x-html"
    #  body = "
    #    <script>
    #      let cors = #{cors.to_json};

          #{File.read("./window.js")}

    #      _window.document.write(atob('#{Base64.strict_encode(response.body)}'));
    #    </script>
    #  "
    when "application/javascript" || "application/x-javascript" || "text/javascript"
      body = "
        (function (window) {
          delete _window;

          #{response.body}
        }({ window, ..._window }));
      "
    when "application/manifest+json"
      json = JSON.parse(response.body)
      body = json.to_json
    end
    puts body
    context.response.print body
  end
end

ws = HTTP::WebSocketHandler.new do |ws, context|
  ws.on_ping { ws.pong context.request.path }
end

http.bind_tcp "127.0.0.1", 8080
http.listen