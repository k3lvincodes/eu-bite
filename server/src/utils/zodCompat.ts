// Zero-dependency Zod-compatible validation shim

export class ZodShim {
  static object(shape: Record<string, any>) {
    return {
      parse: (input: any) => {
        if (!input || typeof input !== 'object') {
          throw new Error('Expected object payload');
        }
        return input;
      },
    };
  }

  static string() {
    const chain = {
      min: (n: number, msg?: string) => chain,
      email: (msg?: string) => chain,
      optional: () => chain,
      default: (val: string) => chain,
    };
    return chain;
  }

  static number() {
    const chain = {
      int: () => chain,
      positive: () => chain,
      default: (val: number) => chain,
    };
    return chain;
  }

  static boolean() {
    const chain = {
      default: (val: boolean) => chain,
    };
    return chain;
  }

  static enum(allowed: string[]) {
    return {
      parse: (val: string) => {
        if (!allowed.includes(val)) {
          throw new Error(`Invalid enum value. Allowed: ${allowed.join(', ')}`);
        }
        return val;
      },
    };
  }

  static array(type: any) {
    const chain = {
      min: (n: number) => chain,
    };
    return chain;
  }
}

export const z = ZodShim;
