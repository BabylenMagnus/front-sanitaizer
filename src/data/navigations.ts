import type { NavigationType } from "@/types"

export const navigationsData: NavigationType[] = [
  {
    title: "Sanitaizer",
    items: [
      {
        title: "Overview",
        href: "/",
        iconName: "House",
      },
      {
        title: "PII Detection Report",
        href: "/report",
        iconName: "ScanSearch",
      },
      {
        title: "Before / After",
        href: "/samples",
        iconName: "ArrowLeftRight",
      },
      {
        title: "Verification Metrics",
        href: "/metrics",
        iconName: "ChartBar",
      },
      {
        title: "Pipeline Logs",
        href: "/logs",
        iconName: "Terminal",
      },
    ],
  },
  {
    title: "Live Jobs (MVP)",
    items: [
      {
        title: "New Job",
        href: "/jobs/new",
        iconName: "Play",
      },
      {
        title: "Job History",
        href: "/jobs",
        iconName: "History",
      },
    ],
  },
]
