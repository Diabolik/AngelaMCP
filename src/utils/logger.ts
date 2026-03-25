export type LogLevel = "debug" | "info" | "warn" | "error";

const levelOrder: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

export class Logger {
  public constructor(private readonly level: LogLevel = "info") {}

  public debug(message: string, meta?: unknown): void {
    this.log("debug", message, meta);
  }

  public info(message: string, meta?: unknown): void {
    this.log("info", message, meta);
  }

  public warn(message: string, meta?: unknown): void {
    this.log("warn", message, meta);
  }

  public error(message: string, meta?: unknown): void {
    this.log("error", message, meta);
  }

  private log(level: LogLevel, message: string, meta?: unknown): void {
    if (levelOrder[level] < levelOrder[this.level]) {
      return;
    }

    const payload = meta === undefined ? "" : ` ${JSON.stringify(meta)}`;
    process.stderr.write(`[${level.toUpperCase()}] ${message}${payload}\n`);
  }
}
