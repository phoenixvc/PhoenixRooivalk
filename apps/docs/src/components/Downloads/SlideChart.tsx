import * as React from "react";

/**
 * Chart types supported
 */
export type ChartType = "bar" | "line" | "pie" | "donut";

/**
 * Data point for charts
 */
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

/**
 * Props for SlideChart component
 */
interface SlideChartProps {
  /** Chart type */
  type: ChartType;
  /** Data points */
  data: ChartDataPoint[];
  /** Chart title */
  title?: string;
  /** Width in pixels */
  width?: number;
  /** Height in pixels */
  height?: number;
  /** Show values on chart */
  showValues?: boolean;
  /** Show legend */
  showLegend?: boolean;
  /** Custom colors (overrides individual data point colors) */
  colors?: string[];
}

/** Default color palette */
const DEFAULT_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#F97316", // Orange
];

/**
 * Get color for data point
 */
function getColor(
  index: number,
  dataPoint: ChartDataPoint,
  customColors?: string[],
): string {
  if (dataPoint.color) return dataPoint.color;
  if (customColors && customColors[index]) return customColors[index];
  return DEFAULT_COLORS[index % DEFAULT_COLORS.length];
}

/**
 * Bar Chart Component
 */
function BarChart({
  data,
  width,
  height,
  showValues,
  colors,
}: {
  data: ChartDataPoint[];
  width: number;
  height: number;
  showValues: boolean;
  colors?: string[];
}) {
  const maxValue = Math.max(...data.map((d) => d.value));
  const barWidth = (width - 60) / data.length - 10;
  const chartHeight = height - 60;

  return (
    <svg
      width={width}
      height={height}
      className="overflow-visible"
      role="img"
      aria-label={`Bar chart showing ${data.length} data points`}
    >
      <title>Bar chart visualization</title>
      {/* Y-axis */}
      <line
        x1="50"
        y1="20"
        x2="50"
        y2={chartHeight + 20}
        stroke="#6B7280"
        strokeWidth="1"
      />
      {/* X-axis */}
      <line
        x1="50"
        y1={chartHeight + 20}
        x2={width - 10}
        y2={chartHeight + 20}
        stroke="#6B7280"
        strokeWidth="1"
      />

      {/* Bars */}
      {data.map((point, index) => {
        const barHeight = (point.value / maxValue) * chartHeight;
        const x = 60 + index * (barWidth + 10);
        const y = chartHeight + 20 - barHeight;
        const color = getColor(index, point, colors);

        return (
          <g key={index}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={color}
              rx="4"
              className="transition-all duration-300 hover:opacity-80"
            />
            {/* Value label */}
            {showValues && (
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                className="text-xs fill-gray-300"
              >
                {point.value}
              </text>
            )}
            {/* X-axis label */}
            <text
              x={x + barWidth / 2}
              y={chartHeight + 38}
              textAnchor="middle"
              className="text-xs fill-gray-400"
            >
              {point.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Line Chart Component
 */
function LineChart({
  data,
  width,
  height,
  showValues,
  colors,
}: {
  data: ChartDataPoint[];
  width: number;
  height: number;
  showValues: boolean;
  colors?: string[];
}) {
  const maxValue = Math.max(...data.map((d) => d.value));
  const chartWidth = width - 70;
  const chartHeight = height - 60;
  const pointSpacing = chartWidth / (data.length - 1 || 1);
  const color = colors?.[0] || DEFAULT_COLORS[0];

  // Generate path
  const pathData = data
    .map((point, index) => {
      const x = 60 + index * pointSpacing;
      const y = 20 + chartHeight - (point.value / maxValue) * chartHeight;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  // Generate area fill path
  const areaPath = `${pathData} L ${60 + (data.length - 1) * pointSpacing} ${chartHeight + 20} L 60 ${chartHeight + 20} Z`;

  return (
    <svg
      width={width}
      height={height}
      className="overflow-visible"
      role="img"
      aria-label={`Line chart showing ${data.length} data points`}
    >
      <title>Line chart visualization</title>
      {/* Y-axis */}
      <line
        x1="50"
        y1="20"
        x2="50"
        y2={chartHeight + 20}
        stroke="#6B7280"
        strokeWidth="1"
      />
      {/* X-axis */}
      <line
        x1="50"
        y1={chartHeight + 20}
        x2={width - 10}
        y2={chartHeight + 20}
        stroke="#6B7280"
        strokeWidth="1"
      />

      {/* Area fill */}
      <path d={areaPath} fill={color} fillOpacity="0.1" />

      {/* Line */}
      <path
        d={pathData}
        stroke={color}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Points and labels */}
      {data.map((point, index) => {
        const x = 60 + index * pointSpacing;
        const y = 20 + chartHeight - (point.value / maxValue) * chartHeight;

        return (
          <g key={index}>
            {/* Point */}
            <circle
              cx={x}
              cy={y}
              r="5"
              fill={color}
              className="transition-transform duration-300 hover:scale-125 origin-center"
              style={{ transformOrigin: `${x}px ${y}px` }}
            />
            {/* Value label */}
            {showValues && (
              <text
                x={x}
                y={y - 10}
                textAnchor="middle"
                className="text-xs fill-gray-300"
              >
                {point.value}
              </text>
            )}
            {/* X-axis label */}
            <text
              x={x}
              y={chartHeight + 38}
              textAnchor="middle"
              className="text-xs fill-gray-400"
            >
              {point.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Pie/Donut Chart Component
 */
function PieChart({
  data,
  width,
  height,
  showValues,
  colors,
  isDonut,
}: {
  data: ChartDataPoint[];
  width: number;
  height: number;
  showValues: boolean;
  colors?: string[];
  isDonut: boolean;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 40;
  const innerRadius = isDonut ? radius * 0.6 : 0;

  // Precompute segments with start/end angles (immutable)
  const segments = data.reduce<
    Array<{
      point: ChartDataPoint;
      index: number;
      startAngle: number;
      endAngle: number;
      angle: number;
    }>
  >((acc, point, index) => {
    const prevEndAngle =
      acc.length > 0 ? acc[acc.length - 1].endAngle : -Math.PI / 2;
    const angle = (point.value / total) * 2 * Math.PI;
    acc.push({
      point,
      index,
      startAngle: prevEndAngle,
      endAngle: prevEndAngle + angle,
      angle,
    });
    return acc;
  }, []);

  // Generate arc path
  const createArc = (
    startAngle: number,
    endAngle: number,
    outerR: number,
    innerR: number,
  ) => {
    const startOuterX = centerX + Math.cos(startAngle) * outerR;
    const startOuterY = centerY + Math.sin(startAngle) * outerR;
    const endOuterX = centerX + Math.cos(endAngle) * outerR;
    const endOuterY = centerY + Math.sin(endAngle) * outerR;
    const startInnerX = centerX + Math.cos(endAngle) * innerR;
    const startInnerY = centerY + Math.sin(endAngle) * innerR;
    const endInnerX = centerX + Math.cos(startAngle) * innerR;
    const endInnerY = centerY + Math.sin(startAngle) * innerR;

    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

    if (innerR === 0) {
      return `M ${centerX} ${centerY} L ${startOuterX} ${startOuterY} A ${outerR} ${outerR} 0 ${largeArc} 1 ${endOuterX} ${endOuterY} Z`;
    }

    return `M ${startOuterX} ${startOuterY} A ${outerR} ${outerR} 0 ${largeArc} 1 ${endOuterX} ${endOuterY} L ${startInnerX} ${startInnerY} A ${innerR} ${innerR} 0 ${largeArc} 0 ${endInnerX} ${endInnerY} Z`;
  };

  return (
    <svg
      width={width}
      height={height}
      className="overflow-visible"
      role="img"
      aria-label={`${isDonut ? "Donut" : "Pie"} chart showing ${data.length} segments`}
    >
      <title>{isDonut ? "Donut" : "Pie"} chart visualization</title>
      {segments.map(({ point, index, startAngle, endAngle, angle }) => {
        const color = getColor(index, point, colors);

        // Label position (middle of arc)
        const labelAngle = startAngle + angle / 2;
        const labelRadius = radius + 20;
        const labelX = centerX + Math.cos(labelAngle) * labelRadius;
        const labelY = centerY + Math.sin(labelAngle) * labelRadius;

        const percentage = ((point.value / total) * 100).toFixed(1);

        return (
          <g key={index}>
            <path
              d={createArc(startAngle, endAngle, radius, innerRadius)}
              fill={color}
              stroke="#1F2937"
              strokeWidth="2"
              className="transition-all duration-300 hover:opacity-80"
            />
            {showValues && (
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs fill-gray-300"
              >
                {percentage}%
              </text>
            )}
          </g>
        );
      })}

      {/* Center text for donut */}
      {isDonut && (
        <text
          x={centerX}
          y={centerY}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-2xl font-bold fill-white"
        >
          {total}
        </text>
      )}
    </svg>
  );
}

/**
 * Legend Component
 */
function ChartLegend({
  data,
  colors,
}: {
  data: ChartDataPoint[];
  colors?: string[];
}) {
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {data.map((point, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: getColor(index, point, colors) }}
          />
          <span className="text-sm text-gray-400">{point.label}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * SlideChart - Renders data visualizations for slides
 *
 * Supports bar, line, pie, and donut charts with customizable colors and labels.
 * Designed to work within slide presentations.
 */
export default function SlideChart({
  type,
  data,
  title,
  width = 400,
  height = 250,
  showValues = true,
  showLegend = true,
  colors,
}: SlideChartProps): React.ReactElement {
  return (
    <div className="flex flex-col items-center">
      {title && (
        <h4 className="text-lg font-semibold text-gray-200 mb-4">{title}</h4>
      )}

      {type === "bar" && (
        <BarChart
          data={data}
          width={width}
          height={height}
          showValues={showValues}
          colors={colors}
        />
      )}

      {type === "line" && (
        <LineChart
          data={data}
          width={width}
          height={height}
          showValues={showValues}
          colors={colors}
        />
      )}

      {type === "pie" && (
        <PieChart
          data={data}
          width={width}
          height={height}
          showValues={showValues}
          colors={colors}
          isDonut={false}
        />
      )}

      {type === "donut" && (
        <PieChart
          data={data}
          width={width}
          height={height}
          showValues={showValues}
          colors={colors}
          isDonut={true}
        />
      )}

      {showLegend && <ChartLegend data={data} colors={colors} />}
    </div>
  );
}

/**
 * Helper function to create chart data from simple key-value object
 */
export function createChartData(
  data: Record<string, number>,
  colors?: string[],
): ChartDataPoint[] {
  return Object.entries(data).map(([label, value], index) => ({
    label,
    value,
    color: colors?.[index],
  }));
}
