require "http/server"
require "http/client"
require "socket"
require "openssl"
require "json"
require "base64"


macro rewrite_url(url)
  "#{context.request.headers["host"]}/#{{{ url }}}"
  {% debug %}
end

server = HTTP::Server.new do |context|
  request_uri = context.request.path.lchop('/')
  request_origin = request_uri.split('/')[2]
  request_url = req_uri.lchop("http").lchop('s').lchop("://")
  request_host = req_origin.first?

  context.request.headers.host = request_host
  context.request.headers.location = rewrite_url(context.request.headers.location)
  
  if {{ flag?(:debug) }}
    print(context.request.headers)
  end

  HTTP::Client.options(url, {headers: context.request.headers}) do |response|
    cors = Hash.new
    response.headers.each do |key, value|
      if key.in? "content-encoding", "timing-allow-origin", "x-frame-options"
        cors[key] = value
        next
      elsif key.in? "set_cookie", "set_cookie2"
         # Rewrite
      elsif key == "origin"
        context.response.headers[key] = request_origin
      else
        context.response.headers[key] = value
      end
    end

    context.response.status_code = response.status_code

    case response.headers["content-type"].split(';').first?
    when "text/html" || "text/x-html"
      body = "
        <script>
            let cors = #{cors.to_json};

            #{
            if {{ flag?(:debug)}}
              File.read("_window.js")
            else
              {{ read_file("_window.js") }}
            end
            }
    
            document.write(atob('#{Base64.strict_encode(response.body)}'));
        </script>
        "
    when "application/javascript" || "application/x-javascript" || "text/javascript"
      body = "
        (function (window) {
            delete _window;

            #{response.body}
        }({ window, ..._window }));
        "
    when "application/manifest+json"
      json = JSON.parse(response.body)
      # TODO: Rewrite
      body = json.to_json
    end
    context.response.print body
    if {{ flag?(:debug) }}
      print body
    end
end

ssl = OpenSSL::SSL::Context::Server.new
ssl.certificate_chain = ARGV[1]
ssl.private_key = ARGV[2]

server.bind_tls "127.0.0.1", ARGV[0], context
