/** Stands in for next/headers: one browser's cookies, outside any request. */
export const jar = new Map<string, string>();

export async function cookies() {
  return {
    get: (name: string) => {
      const value = jar.get(name);
      return value === undefined ? undefined : { name, value };
    },
    set: (name: string, value: string) => void jar.set(name, value),
    delete: (name: string) => void jar.delete(name),
  };
}
