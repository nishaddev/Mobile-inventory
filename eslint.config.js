import eslintConfigNext from 'eslint-config-next'

export default [
  ...eslintConfigNext,
  {
    rules: {
      // Disable any rules that incorrectly suggest bg-linear-to-br
      // This is a temporary fix for the false positive error
      'tailwindcss/classnames-order': 'off'
    }
  }
]