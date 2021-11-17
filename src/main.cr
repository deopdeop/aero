require "http/server"
require "http/client"
require "json"
require "base64"

server = HTTP::Server.new do |context|
  # TODO: Convert to macro
  def rewrite_url(url)
    return context.request.headers["host"] + '/' + url
  end

  request_uri = context.request.path.lchop('/')
  request_url = req_uri.lchop("http").lchop('s').lchop("://")
  request_host = req_url.split('/').first?

  context.request.headers.host = request_host
  context.request.headers.location = rewrite_url(context.request.headers.location)

  HTTP::Client.options(url, {headers: context.request.headers}) do |response|
    cors = Hash.new
    response.headers.each do |key, value|
      # TODO: Add more header keys
      if key.in? "content-type", "x-frame-options"
        cors[key] = value
        next
      end
      context.response.headers[key] = value
    end

    context.response.status_code = response.status_code

    # TODO: Add more deprecated content types
    case response.headers["content-type"].split(';').first?
    when "text/html"
      body = "
        <script>
            let cors = #{cors.to_json};

            #{File.read("_window.js")}

            document.write(atob('#{Base64.strict_encode(response.body)}'));
        </script>
        "
    when "application/javascript" || "application/x-javascript" || "text/javascript"
      body = "
        (function (window) {
            delete _window;

            #{response.body}
        }({ ...window, ..._window }));
        "
    when "application/manifest+json"
      json = JSON.parse(response.body)
      puts json
      # TODO: Implement manifest rewriting
      body = json.to_json
    end
    puts body
    context.response.print body
  end
end

server.listen(80)
