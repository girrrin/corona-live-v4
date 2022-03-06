import React, { useMemo, useRef, useState } from "react";

import { rem } from "polished";
import { CSS } from "@stitches/react";
import { Link } from "react-router-dom";
import { useInView } from "react-intersection-observer";

import { numberWithCommas } from "@utils/number-util";
import { styled, theme } from "@styles/stitches.config";

import Space from "./Space";
import DeltaTag from "./DeltaTag";
import { ArrowDownIcon, ArrowUpIcon } from "./icon/Icon_Arrow";

export interface TableColumn<T> {
  id: T;
  name: string;
  sortable?: boolean;
  defaultSortBy?: boolean;
  width?: string;
  deltaPosition?: "right" | "bottom";
}

export interface TableRowValue {
  image?: string;
  text?: string;
  stat?: number;
  delta?: number;
}
export type TableRow<T extends string> = Partial<
  Record<T | "link", TableRowValue>
>;

interface Props<T extends string> {
  columns: Array<TableColumn<T>>;
  rows: Array<TableRow<T>>;
  statUnit?: string;
  css?: CSS;
  stickyColumnIndex?: Array<number>;
}

type Order = "desc" | "asc";

const Table = <T extends string>(props: Props<T>) => {
  const { columns, rows, statUnit, css, stickyColumnIndex = [0] } = props;

  const initalSortBy = columns.find(
    (a) => a.defaultSortBy === true && a.sortable === true
  )?.id as T;

  const [sortBy, setSortBy] = useState<T>(initalSortBy);
  const [sortOrder, setSortOrder] = useState<Order>("desc");

  const sortedRows = useMemo(
    () =>
      sortBy
        ? rows.sort((rowA, rowB) =>
            sortOrder === "asc"
              ? (rowA[sortBy].stat ?? 0) - (rowB[sortBy].stat ?? 0)
              : (rowB[sortBy].stat ?? 0) - (rowA[sortBy].stat ?? 0)
          )
        : rows,
    [rows, sortOrder, sortBy]
  );

  const tableRef = useRef<HTMLTableElement>(null);

  const { ref: inViewRef } = useInView({
    threshold: 0,
    trackVisibility: true,
    delay: 100,
  });

  return (
    <Wrapper>
      <InViewCheck ref={inViewRef} />
      <StyledTable css={css} ref={tableRef}>
        <thead>
          <tr>
            {columns.map(({ id, name, width, sortable }, index) => {
              const onClick = () => {
                if (sortable) {
                  setSortOrder((prevOrder) =>
                    sortBy === id
                      ? prevOrder === "desc"
                        ? "asc"
                        : "desc"
                      : "desc"
                  );
                  setSortBy(id);
                }
              };

              const stickyLeft = rem(
                index > 0
                  ? tableRef.current?.querySelector(
                      `thead > tr > th:nth-child(${index})`
                    )?.clientWidth +
                      6 * (index + 1)
                  : 6
              );

              const isSticky = stickyColumnIndex.includes(index);

              return (
                <HeaderTh
                  key={index}
                  style={{
                    ...(width && { minWidth: width }),
                    ...(sortable && { cursor: "pointer" }),
                    ...(isSticky && { left: stickyLeft }),
                  }}
                  sticky={isSticky}
                  onClick={onClick}
                >
                  <HeaderWrapper>
                    <HeaderName>{name}</HeaderName>
                    {sortBy === id && (
                      <>
                        {sortOrder === "desc" && (
                          <ArrowUpIcon stroke={theme.colors.gray700} />
                        )}
                        {sortOrder === "asc" && (
                          <ArrowDownIcon stroke={theme.colors.gray700} />
                        )}
                      </>
                    )}
                  </HeaderWrapper>
                </HeaderTh>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row, index) => (
            <tr key={index}>
              {columns.map(({ id, width, deltaPosition }, index) => {
                const children = (
                  <Cell
                    ref={inViewRef}
                    css={
                      index !== 0 && deltaPosition === "bottom"
                        ? {
                            justifyContent: "flex-end",
                          }
                        : null
                    }
                  >
                    {!!row[id]?.image && <img src={row[id]?.image} alt={""} />}

                    {!!row[id]?.text && <Text>{row[id].text}</Text>}
                    <StatContainer column={deltaPosition === "bottom"}>
                      {row[id]?.stat !== undefined && (
                        <>
                          <Stat>{numberWithCommas(row[id].stat)}</Stat>
                          {statUnit && <StatUnit>{statUnit}</StatUnit>}
                        </>
                      )}
                      {!!row[id]?.delta && (
                        <>
                          <Space w={6} />
                          <DeltaTag delta={Number(row[id].delta)} small />
                        </>
                      )}
                    </StatContainer>
                  </Cell>
                );

                const linkChildren = row?.link?.text ? (
                  <Link to={row?.link?.text}>{children}</Link>
                ) : (
                  <>{children}</>
                );

                const stickyLeft = rem(
                  index > 0
                    ? tableRef.current?.querySelector(
                        `thead > tr > th:nth-child(${index})`
                      )?.clientWidth +
                        6 * (index + 1)
                    : 6
                );

                const isSticky = stickyColumnIndex.includes(index);

                const style = width ? { minWidth: width } : {};

                return isSticky ? (
                  <th
                    key={`${id}/${index}`}
                    style={{
                      ...style,
                      left: stickyLeft,
                      zIndex: stickyColumnIndex.length - index,
                    }}
                  >
                    {linkChildren}
                  </th>
                ) : (
                  <td key={`${id}/${index}`} style={style}>
                    {linkChildren}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </StyledTable>
    </Wrapper>
  );
};

const Wrapper = styled("div", {
  overflowX: "auto",
  position: "relative",
  paddingBottom: rem(16),
  paddingX: rem(12),
  width: "100%",
  height: "100%",

  "@md": {
    paddingX: rem(20),
  },
});

const Cell = styled("div", {
  rowCenteredY: true,
  minHeight: rem(48),
  maxHeight: rem(48),
  paddingX: rem(8),
  borderRadius: rem(8),
  flexShrink: 0,
  textAlign: "left",

  "& img": {
    width: rem(20),
    borderRadius: rem(2),
    marginRight: rem(6),
  },
});

const StyledTable = styled("table", {
  overflowY: "auto",
  borderSpacing: `${rem(6)} ${rem(2)}`,

  "& thead th": {
    whiteSpace: "nowrap",
  },

  "& tbody": {
    "& tr": {
      subtitle3: true,
      position: "relative",

      color: "$gray900",

      [`&:nth-child(odd) ${Cell}`]: {
        background: "$gray100",
      },
    },

    "& td, & th": {
      padding: rem(0),
      borderRadius: rem(8),
      position: "relative",
      verticalAlign: "middle",
      background: "$white",

      "& a": {
        color: "$gray900",
        textDecoration: "none",
      },
    },

    "& th": {
      position: "sticky",
      "&": {
        position: "-webkit-sticky",
      },
      zIndex: 1,

      "&:first-of-type": {
        [`& ${Cell}`]: {
          justifyContent: "center",
        },
      },

      "&:before": {
        content: "",
        position: "absolute",
        borderRadius: rem(8),
        background: "$white",
        width: "calc(200%)",
        height: "100%",
        right: 0,
        top: 0,
        bottom: 0,
        zIndex: -1,
      },

      "&:after": {
        content: "",
        position: "absolute",
        background: "inherit",
        boxShadow: `${rem(4)} 0 ${rem(14)} ${rem(4)} #00000005`,
        transition: "150ms",
        width: rem(0.1),
        height: "100%",
        right: 2,
        top: 0,
        bottom: 0,
        zIndex: -1,
      },
    },
  },
});

const HeaderTh = styled("th", {
  position: "relative",

  paddingBottom: rem(12),
  paddingLeft: rem(2),

  variants: {
    sticky: {
      true: {
        position: "sticky",
        "&": {
          position: "-webkit-sticky",
        },
        zIndex: 1,

        "&:before": {
          content: "",
          position: "absolute",
          borderRadius: rem(8),
          background: "$white",
          width: "calc(200%)",
          height: "100%",
          right: 0,
          top: 0,
          bottom: 0,
          zIndex: -1,
        },
      },
    },
    shadow: {
      true: {
        boxShadow: `${rem(4)} 0 ${rem(14)} ${rem(4)} #0000000005`,
      },
    },
  },
});

const HeaderWrapper = styled("div", {
  rowCenteredY: true,
  background: "$white",
});

const HeaderName = styled("div", {
  caption1: true,
  color: "$gray700",
  textAlign: "left",

  "& + svg": {
    marginLeft: rem(4),
  },
});

const Text = styled("div", {});
const Stat = styled("div", {
  flexShrink: 0,

  [`& + ${DeltaTag}`]: {
    marginLeft: rem(6),
  },
});

const StatUnit = styled("div", {
  caption2: true,

  opacity: 0.6,
  marginLeft: rem(2),
});

const StatContainer = styled("div", {
  rowCenteredY: true,
  variants: {
    column: {
      true: {
        column: true,
        alignItems: "flex-end",
        [`${Stat}`]: {
          marginBottom: rem(2),
        },
      },
    },
  },
});

const InViewCheck = styled("div", {
  width: rem(1),
  height: "100%",
  position: "absolute",
  top: 0,
  background: "transparent",
});

export default Table;
