export function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

export class FakeAxios {
  constructor() {
    this.calls = [];
    this.routes = new Map();
  }

  // For direct axios.get calls
  async get(url, config = {}) {
    this.calls.push({ method: 'get', url, config });
    const key = `GET ${url}`;
    if (this.routes.has(key)) return this.routes.get(key)();
    return { status: 200, data: {} };
  }

  create(config = {}) {
    const parent = this;
    const calls = this.calls;
    const routes = this.routes;
    const baseURL = config.baseURL || '';
    return {
      config,
      interceptors: { response: { use: () => {} } },
      async get(path) {
        const url = baseURL ? `${baseURL}${path}` : path;
        calls.push({ method: 'get', url, path, baseURL });
        const key = `GET ${path}`;
        if (routes.has(key)) return routes.get(key)();
        return { status: 200, data: {} };
      },
      async post(path, data) {
        const url = baseURL ? `${baseURL}${path}` : path;
        calls.push({ method: 'post', url, path, baseURL, data });
        const key = `POST ${path}`;
        if (routes.has(key)) return routes.get(key)();
        return { status: 204, data: {} };
      },
      async delete(path) {
        const url = baseURL ? `${baseURL}${path}` : path;
        calls.push({ method: 'delete', url, path, baseURL });
        const key = `DELETE ${path}`;
        if (routes.has(key)) return routes.get(key)();
        return { status: 204, data: {} };
      },
    };
  }

  on(method, path, fn) {
    this.routes.set(`${method.toUpperCase()} ${path}`, fn);
    return this;
  }
}

export function lastCall(fakeAxios, method, pathStartsWith) {
  const calls = fakeAxios.calls.filter(c => c.method === method);
  const call = calls.reverse().find(c => c.url.includes(pathStartsWith) || (c.path && c.path.startsWith(pathStartsWith)));
  return call;
}

