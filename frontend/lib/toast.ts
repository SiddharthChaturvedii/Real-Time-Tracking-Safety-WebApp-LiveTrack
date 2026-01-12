type ToastHandler = (msg: string) => void;

let handler: ToastHandler | null = null;

export function registerToast(fn: ToastHandler) {
  handler = fn;
}

export function toast(message: string) {
  if (handler) handler(message);
}
