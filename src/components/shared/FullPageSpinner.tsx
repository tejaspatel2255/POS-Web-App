// src/components/shared/FullPageSpinner.tsx
import React from 'react'

export default function FullPageSpinner() {
  return (
    <div style={{ position:'fixed', inset:0, display:'flex',
      alignItems:'center', justifyContent:'center',
      backgroundColor:'#fffbf5', zIndex:9999 }}>
      <div style={{ width:44, height:44, borderRadius:'50%',
        border:'3px solid #e2e8f0', borderTopColor:'#0f766e',
        animation:'pos-spin 0.7s linear infinite' }} />
      <style>{`@keyframes pos-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
