export class PathUtils {
  static getChickeeDuckAdminAPI(resource: string): string {
    return `https://${process.env.API_KEY}:${process.env.PASSWORD}@${process.env.HOSTNAME}/admin/api/${process.env.API_VERSION}/${resource}.json`;
  }
}
