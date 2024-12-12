module.exports = {
  content: [
    "./popup/**/*.{html,js}",
    "./services/**/*.js",
    "./background/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          50: '#f0fdf4',
          400: '#34d399',
          600: '#059669'
        },
        gray: {
          50: '#f9fafb',
          300: '#d1d5db',
          600: '#4b5563'
        }
      }
    }
  },
  safelist: [
    // 状态指示器相关
    'bg-emerald-50',
    'bg-emerald-400',
    'text-emerald-600',
    'bg-gray-50',
    'bg-gray-300',
    'text-gray-600',
    // 布局相关
    'flex',
    'items-center',
    'gap-1',
    'gap-2',
    'flex-1',
    'min-w-0',
    'truncate',
    'whitespace-nowrap',
    // 通用样式
    'rounded-full',
    'text-sm',
    'text-xs',
    'text-base-content',
    'text-base-content/40',
    'text-base-content/60',
    'font-medium',
    'inline-block',
    'w-2',
    'h-2',
    'mr-2',
    'px-3',
    'py-1'
  ],
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["light"]
  }
}