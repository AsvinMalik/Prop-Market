import { useEffect } from 'react';

const LOCK_COUNT_KEY = 'scrollLockCount';
const PREV_HTML_OVERFLOW_KEY = 'prevHtmlOverflow';
const PREV_BODY_OVERFLOW_KEY = 'prevBodyOverflow';
const PREV_BODY_PADDING_RIGHT_KEY = 'prevBodyPaddingRight';

export const useBodyScrollLock = (locked: boolean) => {
  useEffect(() => {
    if (!locked || typeof document === 'undefined') {
      return;
    }

    const { body, documentElement } = document;
    const lockCount = Number(body.dataset[LOCK_COUNT_KEY] || '0');

    if (lockCount === 0) {
      body.dataset[PREV_HTML_OVERFLOW_KEY] = documentElement.style.overflow;
      body.dataset[PREV_BODY_OVERFLOW_KEY] = body.style.overflow;
      body.dataset[PREV_BODY_PADDING_RIGHT_KEY] = body.style.paddingRight;

      const scrollbarWidth = window.innerWidth - documentElement.clientWidth;
      documentElement.style.overflow = 'hidden';
      body.style.overflow = 'hidden';

      if (scrollbarWidth > 0) {
        body.style.paddingRight = `${scrollbarWidth}px`;
      }
    }

    body.dataset[LOCK_COUNT_KEY] = String(lockCount + 1);

    return () => {
      const nextLockCount = Math.max(Number(body.dataset[LOCK_COUNT_KEY] || '1') - 1, 0);

      if (nextLockCount === 0) {
        documentElement.style.overflow = body.dataset[PREV_HTML_OVERFLOW_KEY] || '';
        body.style.overflow = body.dataset[PREV_BODY_OVERFLOW_KEY] || '';
        body.style.paddingRight = body.dataset[PREV_BODY_PADDING_RIGHT_KEY] || '';
        delete body.dataset[LOCK_COUNT_KEY];
        delete body.dataset[PREV_HTML_OVERFLOW_KEY];
        delete body.dataset[PREV_BODY_OVERFLOW_KEY];
        delete body.dataset[PREV_BODY_PADDING_RIGHT_KEY];
        return;
      }

      body.dataset[LOCK_COUNT_KEY] = String(nextLockCount);
    };
  }, [locked]);
};
