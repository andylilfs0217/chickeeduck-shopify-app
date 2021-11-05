import * as url from 'url';

export class ShopifyUtils {
  static parseLinkHeader(header: any) {
    return header.split(',').reduce(ShopifyUtils.reducer, {});
  }

  static reducer(acc: any, cur: any) {
    const pieces = cur.trim().split(';');
    const link = url.parse(pieces[0].trim().slice(1, -1), true);
    const rel = pieces[1].trim().slice(4);
    if (rel === '"next"') acc.next = link;
    else acc.previous = link;
    return acc;
  }
}
