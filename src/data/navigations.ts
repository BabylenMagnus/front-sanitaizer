import type { NavigationType } from "@/types"

export const navigationsData: NavigationType[] = [
  {
    title: "Sanitaizer",
    items: [
      {
        title: "Обзор",
        href: "/",
        iconName: "House",
      },
      {
        title: "Отчёт по PII",
        href: "/report",
        iconName: "ScanSearch",
      },
      {
        title: "До / После",
        href: "/samples",
        iconName: "ArrowLeftRight",
      },
      {
        title: "Метрики верификации",
        href: "/metrics",
        iconName: "ChartBar",
      },
      {
        title: "Логи пайплайна",
        href: "/logs",
        iconName: "Terminal",
      },
    ],
  },
  {
    title: "Задачи (Live Jobs)",
    items: [
      {
        title: "Новая задача",
        href: "/jobs/new",
        iconName: "Play",
      },
      {
        title: "История задач",
        href: "/jobs",
        iconName: "History",
      },
    ],
  },
]
