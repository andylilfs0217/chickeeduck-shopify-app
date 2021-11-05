export class PathUtils {
  static getChickeeDuckShopifyAdminAPI(resource: string): string {
    return `https://${process.env.API_KEY}:${process.env.PASSWORD}@${process.env.HOSTNAME}/admin/api/${process.env.API_VERSION}/${resource}.json`;
  }

  static getChickeeDuckServerAPI(path: string): string {
    return `http://${process.env.CHICKEEDUCK_HOSTNAME}:${process.env.CHICKEEDUCK_PORT}/${path}`;
  }
}
