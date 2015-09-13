require 'rubygems'

# map '/config.js' do
#   run Rack::File.new('./config.js')
# end

map '/' do
  run Rack::Directory.new('./')
end

# map '/jspm_packages/' do
#   run Rack::Directory.new('./jspm_packages/')
# end

# map '/bower_components/' do
#   run Rack::Directory.new('./bower_components/')
# end
