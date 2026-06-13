module.exports = {
  apps: [
    {
      name: 'deltoro-backend',
      script: 'server.js',
      cwd: './backend',

      exec_mode: 'cluster',
      instances: 1,

      wait_ready: true,
      listen_timeout: 15000,
      kill_timeout: 8000,

      autorestart: true,
      max_restarts: 10,
      min_uptime: '15s',
      restart_delay: 2000,

      max_memory_restart: '600M',

      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },

      out_file: './logs/pm2-out.log',
      error_file: './logs/pm2-error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      watch: false,
      ignore_watch: ['node_modules', 'uploads', 'logs', '*.log'],

      source_map_support: true,
    },
  ],
}