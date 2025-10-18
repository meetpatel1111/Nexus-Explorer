const { whenDev } = require('@craco/craco');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Add fallback for Node.js core modules
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        "path": require.resolve("path-browserify"),
        "fs": false,
        "os": false,
        "crypto": false,
        "stream": require.resolve("stream-browserify"),
        "util": require.resolve("util/")
      };

      // Configure target for Electron
      webpackConfig.target = 'electron-renderer';
      
      // Add externals
      webpackConfig.externals = {
        ...webpackConfig.externals,
        electron: 'require("electron")',
        child_process: 'require("child_process")',
        fs: 'require("fs")',
        path: 'require("path")',
      };

      // Always disable TypeScript type checking to avoid fork-ts-checker-webpack-plugin issues
      webpackConfig.plugins = webpackConfig.plugins.filter(
        plugin => plugin.constructor.name !== 'ForkTsCheckerWebpackPlugin'
      );
      
      // Disable type checking in babel-loader
      if (webpackConfig.module && webpackConfig.module.rules) {
        const babelLoader = webpackConfig.module.rules.find(
          rule => rule.loader && rule.loader.includes('babel-loader')
        );
        if (babelLoader && babelLoader.options) {
          babelLoader.options.presets = babelLoader.options.presets || [];
          babelLoader.options.plugins = babelLoader.options.plugins || [];
          
          // Add TypeScript preset if not present
          if (!babelLoader.options.presets.some(p => p && p.includes('@babel/preset-typescript'))) {
            babelLoader.options.presets.push('@babel/preset-typescript');
          }
          
          // Add TypeScript transform plugin
          babelLoader.options.plugins.push('@babel/plugin-transform-typescript');
        }
      }

      return webpackConfig;
    }
  }
};
