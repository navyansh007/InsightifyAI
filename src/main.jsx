import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ChakraProvider, extendTheme } from '@chakra-ui/react'

// Extend the Chakra UI theme with custom colors and styles
const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: 'black',
        color: 'white',
      },
    },
  },
  colors: {
    brand: {
      50: '#e0e7ff',
      100: '#c7d2fe',
      200: '#a5b4fc',
      300: '#818cf8',
      400: '#6366f1',
      500: '#4f46e5',
      600: '#4338ca',
      700: '#3730a3',
      800: '#312e81',
      900: '#1e1b4b',
    },
  },
  fonts: {
    body: "'Inter', sans-serif",
    heading: "'Inter', sans-serif",
  },
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </React.StrictMode>,
)