require "http"
require "uri"
require "json"
require "base64"

macro rewrite_uri(url)
  "#{context.request.headers["host"]}/#{{{url}}}"
end

http = HTTP::Server.new do |context|
  request_uri = URI.parse(context.request.path.lchop('/'))
  
  request_headers = HTTP::Headers.new
  context.request.headers.each do |key, value|
    case key
    when "host"
      request_headers[key] = context.request.headers["Host"]
    when "location" || "referer"
      request_headers[key] = rewrite_uri(value)
    else
      request_headers[key] = value
    end
  end 

  # FIXME
  #HTTP::Client.options(request_uri, { headers: request_headers }) do |response|
  HTTP::Client.get(request_uri) do |response|
    cors = HTTP::Headers.new
    response.headers.each do |key, value|
      if key.in? "Content-Encoding", "Timing-Allow-Origin", "X-Frame-Options", "X-XSS-Protection"
        puts "Deleting " + key
        cors[key] = value
        next
      end
      context.response.headers[key] = value
    end

    context.response.status_code = response.status_code

    # response.body returns nothing so response.body_io.gets_to_end is a placeholder.
    case response.headers["content-type"].split(';').first
    when "text/html" || "text/x-html"
      puts cors.to_json
      body = "
<script>
let ctx = {
    host: '#{context.request.headers["Host"]}',
    request: {
        cors: #{cors.to_json},
        url: new URL('#{request_uri}')
    }
};  

#{File.read("./browser.js")}

_window.document.write(atob('#{Base64.strict_encode(response.body_io.gets_to_end)}'));
</script>
      "
    when "application/javascript" || "application/x-javascript" || "text/javascript"
      # TODO: Move all imports outside of self invoking function and redirect path to /import with regex this should fix sites like bread boy's when it loading three js, same on the browser too.
      body = "
(function (window) {
    #{response.body_io.gets_to_end}
}({ window, ..._window }));
      "
    when "application/manifest+json"
      json = JSON.parse(response.body)
      # TODO: Rewrite manifest.json
      body = json.to_json
    else
      body = response.body_io.gets_to_end
    end
    context.response.print body
  end
end

ws = HTTP::WebSocketHandler.new do |ws, context|
  ws.on_ping { ws.pong context.request.path }
end

http.bind_tcp "127.0.0.1", 8080
http.listen
