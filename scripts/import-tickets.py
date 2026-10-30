#!/usr/bin/env python3
"""Импорт официальных экзаменационных билетов ГИБДД (категории A, B, M).

Источник данных: https://github.com/etspring/pdd_russia (папка questions/A_B/tickets
и images/A_B). Скрипт читает JSON билетов, сжимает картинки в WebP и пишет компактный
файл public/tickets/ab.json, который приложение загружает по требованию.

Запуск:  python3 -I scripts/import-tickets.py /путь/к/pdd_russia
"""
import json
import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'public' / 'tickets'
# Ссылка на правило в конце пояснения: «…(Пункт 13.9 ПДД)», «…(«Дорожные знаки», пункт 10.3 ПДД)».
RULE_RE = re.compile(r'\(\s*([^()]*(?:\([^()]*\)[^()]*)*)\)\s*\.?\s*$')


def main(src: Path) -> None:
    tickets_dir = src / 'questions' / 'A_B' / 'tickets'
    img_src = src / 'images' / 'A_B'
    img_out = OUT / 'img'
    img_out.mkdir(parents=True, exist_ok=True)

    topics: list[str] = []
    questions = []
    images: set[str] = set()
    for t in range(1, 41):
        data = json.loads((tickets_dir / f'Билет {t}.json').read_text(encoding='utf-8'))
        for item in data:
            n = int(re.search(r'\d+', item['title']).group())
            answers = [a['answer_text'].strip() for a in item['answers']]
            correct = next(i for i, a in enumerate(item['answers']) if a['is_correct'])
            tip = re.sub(r'\s+', ' ', item.get('answer_tip') or '').strip()
            rule = None
            m = RULE_RE.search(tip)
            if m:
                rule = m.group(1).replace(' ПДД', '').strip()
                rule = rule[:1].upper() + rule[1:]
                tip = tip[: m.start()].strip()
            img = None
            name = Path(item['image']).name
            if 'no_image' not in name and (img_src / name).exists():
                img = Path(name).stem + '.webp'
                images.add(name)
            tids = []
            for tp in item['topic']:
                if tp not in topics:
                    topics.append(tp)
                tids.append(topics.index(tp))
            questions.append({
                'id': item['id'],
                't': t,
                'n': n,
                'q': item['question'].strip(),
                'a': answers,
                'c': correct,
                'tip': tip,
                'rule': rule,
                'img': img,
                'topics': tids,
            })

    for name in sorted(images):
        dst = img_out / (Path(name).stem + '.webp')
        if dst.exists():
            continue
        with Image.open(img_src / name) as im:
            im = im.convert('RGB')
            if im.width > 720:
                im = im.resize((720, round(im.height * 720 / im.width)), Image.LANCZOS)
            im.save(dst, 'WEBP', quality=74, method=6)

    out = {
        'source': 'Официальные экзаменационные билеты ГИБДД, категории A, B, M. Данные: github.com/etspring/pdd_russia',
        'topics': topics,
        'questions': questions,
    }
    (OUT / 'ab.json').write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    size = sum(p.stat().st_size for p in img_out.glob('*.webp'))
    print(f'{len(questions)} вопросов, {len(topics)} тем, {len(images)} картинок ({size / 1e6:.1f} МБ)')


if __name__ == '__main__':
    main(Path(sys.argv[1]).resolve())
