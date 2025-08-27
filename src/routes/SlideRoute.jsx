// src/routes/SlideRoute.jsx
import { SlideProvider } from '../components/user/slide/SlideProvider.jsx'
import { SlideConfig } from '../components/user/slide/slideConfig.js'
import SlideRenderer from '../components/user/slide/SlideRenderer.jsx'

export default function SlideRoute() {
  return (
    <SlideProvider
      config={SlideConfig}
      defaultCooldownMs={0}
      blockPolicy="global"
    >
      <SlideRenderer />
    </SlideProvider>
  )
}