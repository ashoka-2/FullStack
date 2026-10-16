import React from 'react';
import { Link } from 'react-router';
import { RiArrowRightSLine } from '@remixicon/react';

/**
 * Group: Container for minimal-ai-ui grouped list rows with a 2dp gap.
 * Automatically decorates child rows with isFirst / isLast / isOnly props.
 */
export const Group = ({ children, className = '', ...props }) => {
  const childrenArray = React.Children.toArray(children).filter(Boolean);
  const count = childrenArray.length;

  return (
    <div className={`flex flex-col gap-[2px] w-full ${className}`} {...props}>
      {childrenArray.map((child, index) => {
        if (!React.isValidElement(child)) return child;
        return React.cloneElement(child, {
          isFirst: index === 0 && count > 1,
          isLast: index === count - 1 && count > 1,
          isOnly: count === 1,
          ...child.props,
        });
      })}
    </div>
  );
};

/**
 * GroupLabel: Clean, muted section label above a group of rows.
 */
export const GroupLabel = ({ children, className = '' }) => (
  <p className={`text-xs font-semibold tracking-wider uppercase text-[var(--text-muted)] px-4 mb-2 select-none ${className}`}>
    {children}
  </p>
);

/**
 * GroupFooter: Optional footnote below a group of rows.
 */
export const GroupFooter = ({ children, className = '' }) => (
  <p className={`text-xs text-[var(--text-subtle)] px-4 mt-2 leading-relaxed ${className}`}>
    {children}
  </p>
);

/**
 * Row: Individual row in a Group with 28dp outer / 6dp inner squircle corners.
 */
export const Row = ({
  icon: Icon,
  label,
  description,
  trailing,
  onClick,
  to,
  isFirst,
  isLast,
  isOnly,
  accent = false,
  destructive = false,
  disabled = false,
  className = '',
  children,
  ...props
}) => {
  // Corner squircle classes based on position
  let radiusClass = 'rounded-[6px]';
  if (isOnly) {
    radiusClass = 'rounded-[28px]';
  } else if (isFirst) {
    radiusClass = 'rounded-t-[28px] rounded-b-[6px]';
  } else if (isLast) {
    radiusClass = 'rounded-b-[28px] rounded-t-[6px]';
  }

  const baseClasses = `
    group relative flex items-center gap-3.5 sm:gap-4
    min-h-[56px] sm:min-h-[60px] px-4 sm:px-5 py-3.5
    bg-[var(--surface)] text-[var(--text)]
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-[var(--surface-hover)] active:scale-[0.995]'}
    transition-all duration-150 select-none
    ${radiusClass} ${className}
  `.trim().replace(/\s+/g, ' ');

  const content = (
    <>
      {Icon && (
        <div
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
            accent
              ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
              : destructive
              ? 'bg-[var(--danger)]/10 text-[var(--danger)]'
              : 'bg-[var(--surface-2)] text-[var(--text-muted)] group-hover:text-[var(--text)]'
          }`}
        >
          <Icon size={19} />
        </div>
      )}

      <div className="flex-1 min-w-0">
        {label && (
          <p
            className={`text-sm sm:text-[15px] font-medium leading-snug truncate ${
              accent
                ? 'text-[var(--accent-text)]'
                : destructive
                ? 'text-[var(--danger)]'
                : 'text-[var(--text)]'
            }`}
          >
            {label}
          </p>
        )}
        {description && (
          <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-normal line-clamp-2">
            {description}
          </p>
        )}
        {children}
      </div>

      {trailing !== undefined ? (
        <div className="shrink-0 flex items-center gap-2 text-[var(--text-subtle)]">
          {trailing}
        </div>
      ) : to ? (
        <div className="shrink-0 text-[var(--text-subtle)] group-hover:text-[var(--text)] transition-colors">
          <RiArrowRightSLine size={20} />
        </div>
      ) : null}
    </>
  );

  if (to && !disabled) {
    return (
      <Link to={to} className={baseClasses} {...props}>
        {content}
      </Link>
    );
  }

  if (onClick && !disabled) {
    return (
      <button type="button" onClick={onClick} className={baseClasses} {...props}>
        {content}
      </button>
    );
  }

  return (
    <div className={baseClasses} {...props}>
      {content}
    </div>
  );
};

export default { Group, GroupLabel, GroupFooter, Row };
