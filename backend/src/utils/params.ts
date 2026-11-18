/** Express 5 的 req.params 类型为 string | string[]，这里收窄成 string */
export function param(value: string | string[] | undefined, name = 'param'): string {
  if (typeof value === 'string' && value.length > 0) return value;
  throw new Error(`缺少路径参数 ${name}`);
}
