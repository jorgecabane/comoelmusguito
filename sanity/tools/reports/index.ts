import type { Tool } from 'sanity';
import ReportsTool from './ReportsTool';

export const reportsTool: Tool = {
  name: 'reports',
  title: '📊 Reportes',
  component: ReportsTool,
};
