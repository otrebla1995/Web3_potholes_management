import React from 'react'

type SparklineProps = {
  data: number[]
  width?: number
  height?: number
  stroke?: string
  fill?: string
  strokeWidth?: number
  className?: string
}

export function Sparkline({
  data,
  width = 300,
  height = 80,
  stroke = '#0ea5e9',
  fill = 'rgba(14,165,233,0.15)',
  strokeWidth = 2,
  className
}: SparklineProps) {
  if (!data || data.length === 0) {
    return <div className={className} style={{ width, height }} />
  }

  const max = Math.max(...data)
  const min = Math.min(...data)
  const span = max - min || 1
  const stepX = width / Math.max(data.length - 1, 1)

  const points = data.map((y, i) => {
    const x = i * stepX
    const ny = height - ((y - min) / span) * height
    return `${x},${ny}`
  })

  const pathD = `M ${points.join(' L ')}`

  const areaD = `M 0,${height} L ${points.join(' L ')} L ${width},${height} Z`

  return (
    <svg width={width} height={height} className={className} viewBox={`0 0 ${width} ${height}`}>
      <path d={areaD} fill={fill} />
      <path d={pathD} fill="none" stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  )
}
