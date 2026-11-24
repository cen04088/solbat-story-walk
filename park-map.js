'use strict';

// Facilities and path junctions in the orientation of the Gangbuk-gu guide.
// https://parks.seoul.go.kr/cheditor/attach/20110613/zkpjOxqn.jpg
{
  const canvas = document.querySelector('#terrain');
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const outline = new Path2D('M66 401 L223 131 L421 13 Q473 28 527 65 L486 194 L476 264 Q551 296 635 226 L747 231 Q738 408 654 561 L108 548 Z');
    const ponds = new Path2D('M132 394 C157 362 171 398 151 416 C142 430 161 441 140 456 C111 459 115 414 132 394 Z M127 335 C148 333 143 356 125 354 C117 352 116 344 127 335 Z M416 37 C432 29 443 40 438 55 C433 71 413 67 409 55 C406 47 412 41 416 37 Z');
    const creek = new Path2D('M128 343 C148 311 151 276 174 242 S197 203 216 172 S256 129 281 107 S336 71 356 69 S389 45 421 44');
    const roads = new Path2D('M-9 632 Q113 570 246 563 Q473 551 775 614 M80 600 L56 434 L218 129 L413 10 M516 71 L491 185 L681 206 L758 224 M665 575 Q722 442 759 226');
    const route = new Path2D('M117 534 L123 501 Q151 478 169 468 C162 451 157 428 158 406 Q153 376 145 356 C163 314 172 253 201 225 Q224 197 260 181 C283 158 288 145 297 127 Q334 86 372 83 Q394 66 424 68 C457 45 494 67 501 99 Q492 150 464 180 Q453 194 445 222');
    const paths = new Path2D('M145 356 Q171 353 188 393 T220 468 Q257 490 287 455 Q319 415 357 391 Q386 384 409 398 Q473 408 540 439 Q587 456 641 470 L676 401 Q721 329 716 269 Q707 242 674 240 Q602 269 549 289 Q508 295 476 264 M109 529 Q271 520 352 512 T658 553 M260 181 Q285 174 310 192 L363 214 Q399 227 422 264 L451 332 Q476 361 486 391 M297 127 Q323 125 349 130 L413 157 Q445 172 464 180 M357 391 Q376 359 360 304 Q332 285 304 270 Q260 239 228 231 L201 225 M360 304 Q398 305 422 264 M409 398 Q358 430 344 470 L352 512 M540 439 L536 505 M445 222 L476 264 M674 240 L701 227');

    function stroke(path, color, width) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke(path);
    }

    ctx.fillStyle = '#eae6d9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    stroke(roads, '#d4ccba', 35);
    stroke(roads, '#f7f2e5', 23);
    ctx.fillStyle = '#c8cfb1';
    ctx.fill(outline);
    stroke(outline, '#8e9d78', 3);
    ctx.fillStyle = '#dfdcc0';
    ctx.fill(new Path2D('M282 198 L384 147 L438 181 L373 279 L294 296 L262 266 Z M430 286 L514 278 L535 339 L456 366 Z M317 405 L377 416 L418 480 L349 509 L304 466 Z M552 388 L660 418 L641 470 L538 436 Z'));
    stroke(creek, '#527c7f', 8);
    ctx.fillStyle = '#74a09e';
    ctx.fill(ponds);
    stroke(ponds, '#dbe4d0', 3);

    let seed = 851;
    const random = () => {
      seed = seed * 16807 % 2147483647;
      return seed / 2147483647;
    };
    for (let index = 0; index < 430; index += 1) {
      const x = random() * canvas.width;
      const y = random() * canvas.height;
      const size = 5 + random() * 7;
      const plaza = (x > 279 && x < 402 && y > 163 && y < 287)
        || (x > 424 && x < 541 && y > 274 && y < 363)
        || (x > 302 && x < 416 && y > 411 && y < 508)
        || (x > 534 && x < 663 && y > 385 && y < 472);
      if (plaza || !ctx.isPointInPath(outline, x, y) || ctx.isPointInPath(ponds, x, y)) continue;
      ctx.fillStyle = index % 3 ? '#80956e' : '#516e54';
      ctx.beginPath();
      ctx.moveTo(x, y - size);
      ctx.lineTo(x + size / 2, y + size / 2);
      ctx.lineTo(x - size / 2, y + size / 2);
      ctx.closePath();
      ctx.fill();
    }

    stroke(creek, '#628c8e', 7);
    stroke(paths, '#f7f0dd', 11);
    stroke(route, '#f7f0dd', 15);
    ctx.setLineDash([4, 9]);
    stroke(route, '#17514b', 6);
    ctx.setLineDash([]);
  }
}
