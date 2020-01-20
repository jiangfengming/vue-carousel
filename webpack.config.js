const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const hash = require('hash-sum')

module.exports = (env, argv) => {
  const dev = argv.mode === 'development'

  const conf = {
    mode: dev ? 'development' : 'production',
    devtool: dev ? 'eval-source-map' : 'hidden-source-map',
    entry: './demo-src/index.js',

    optimization: dev ? {} : {
      runtimeChunk: 'single',
      moduleIds: 'hashed',
      splitChunks: {
        chunks: 'all'
      }
    },

    output: {
      path: path.resolve(__dirname, 'demo'),
      filename: dev ? '[name].js' : '[contenthash].js',
      chunkFilename: '[contenthash].js',
      publicPath: dev ? '/' : '/demo/'
    },

    module: {
      rules: [
        {
          enforce: 'pre',
          test: /\.(mjs|js|vue)$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'eslint-loader',
              options: {
                rules: {
                  'no-console': dev ? 'off' : 'error',
                  'no-debugger': dev ? 'off' : 'error'
                }
              }
            }
          ]
        },

        {
          test: /\.vue$/,
          use: ['vue-loader']
        },

        {
          test: /\.(mjs|js)$/,
          include: path.resolve(__dirname, 'demo-src'),
          use: ['babel-loader']
        },

        {
          test: /\.html$/,
          use: [
            {
              loader: 'html-loader',
              options: {
                attrs: ['img:src', 'link:href']
              }
            }
          ]
        },

        {
          test: /\.css$/,
          use: [
            dev ? 'style-loader' : MiniCssExtractPlugin.loader,
            'css-loader',
            'postcss-loader'
          ]
        },

        {
          test: /\.(png|jpg|jpeg|gif|eot|ttf|woff|woff2|svg|svgz|mp3)(\?.+)?$/,
          use: [
            {
              loader: 'url-loader',
              options: {
                limit: 4096,
                esModule: false
              }
            }
          ]
        }
      ]
    },

    plugins: [
      new VueLoaderPlugin(),

      new HtmlWebpackPlugin({
        template: './demo-src/index.html'
      })
    ],

    resolve: {
      mainFiles: ['index', 'Index'],
      extensions: ['.mjs', '.js', '.json', '.vue']
    },

    performance: {
      hints: dev ? false : 'warning'
    }
  }

  if (dev) {
    conf.devServer = {
      host: '0.0.0.0',
      disableHostCheck: true,
      port: 8000,
      historyApiFallback: {
        index: '/',
        disableDotRule: true
      }
    }
  } else {
    const seen = new Set()
    const nameLength = 4

    conf.plugins.push(
      new MiniCssExtractPlugin({
        filename: '[contenthash].css',
        chunkFilename: '[contenthash].css'
      }),

      new webpack.NamedChunksPlugin(chunk => {
        if (chunk.name) {
          return chunk.name
        }
        const modules = Array.from(chunk.modulesIterable)
        if (modules.length > 1) {
          const joinedHash = hash(modules.map(m => m.id).join('_'))
          let len = nameLength
          while (seen.has(joinedHash.substr(0, len))) len++
          seen.add(joinedHash.substr(0, len))
          return joinedHash.substr(0, len)
        } else {
          return modules[0].id
        }
      })
    )
  }

  return conf
}
