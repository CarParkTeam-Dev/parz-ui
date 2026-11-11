import type { CSSProperties } from 'react';
import './ParzCredit.css';

export const PARZ_CREDIT_URL = 'https://dev.carpark.am/parz-ui';

/** Parz UI · ParzCredit — подпись «Components by CarPark Team» со ссылкой, которую требует лицензия Parz UI. */
export interface ParzCreditProps {
  /** Начало подписи на языке вашего продукта, например 'Компоненты от'. По умолчанию 'Components by'. */
  prefix?: string;
  /** Цвет текста. По умолчанию наследуется, с прозрачностью 0.6. */
  color?: string;
  className?: string;
  style?: CSSProperties;
}

export function ParzCredit({ prefix = 'Components by', color, className, style }: ParzCreditProps) {
  return (
    <a className={['pz-credit', className].filter(Boolean).join(' ')} href={PARZ_CREDIT_URL} target="_blank" rel="noopener"
      style={color ? { color, ...style } : style}>
      {prefix} <b>CarPark Team</b>
    </a>
  );
}
