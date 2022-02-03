import React, { useEffect, useState } from "react";

import { rem } from "polished";

import useApi from "@hooks/useApi";
import { styled } from "@styles/stitches.config";
import { ASSETS_URL, COUNTRY_NAMES } from "@constants/constants";

import Section from "@components/Section";
import Table, { TableColumn, TableRow } from "@components/Table";
import { WorldTableKey } from "@_types/world-type";
import WorldApi from "@apis/world-api";

const columns: Array<TableColumn<WorldTableKey | "index" | "countryName">> = [
  {
    id: "index",
    name: "",
    width: rem(10),
  },
  {
    id: "countryName",
    name: "나라",
    width: rem(110),
    deltaPosition: "right",
  },

  {
    id: "confirmed",
    name: "총 확진자",
    width: rem(110),
    sortable: true,
    deltaPosition: "bottom",
  },
  {
    id: "deceased",
    name: "총 사망자",
    width: rem(90),
    sortable: true,
    deltaPosition: "bottom",
  },
  {
    id: "recovered",
    name: "총 완치자",
    width: rem(100),
    sortable: true,
  },
  {
    id: "casesPerMil",
    name: "100만명당 확진",
    width: rem(80),
    sortable: true,
  },
];

type ColumnKey = typeof columns[number]["id"];

const WorldCountrySection: React.FC = () => {
  const { data } = useApi(WorldApi.live);
  const [rowsCount, setRowsCount] = useState(15);

  const rows: Array<TableRow<ColumnKey>> = Object.keys(data.countries)
    .map((countryId, index) => {
      const countryName = COUNTRY_NAMES[countryId];
      const { confirmed, deceased, recovered, casesPerMil } =
        data.countries[countryId];
      return {
        index: { text: index + 1 },
        countryName: {
          text: countryName,
          image: `${ASSETS_URL}/flags/${countryId.toLowerCase()}.svg`,
        },
        confirmed: { stat: confirmed[0], delta: confirmed[1] },
        deceased: { stat: deceased[0], delta: deceased[1] },
        recovered: { stat: recovered[0] },
        casesPerMil: { stat: casesPerMil[0] },
      };
    })
    .filter(({ countryName }) => countryName.text !== undefined)
    .sort(
      ({ confirmed: confirmedA }, { confirmed: confirmedB }) =>
        confirmedB.stat - confirmedA.stat
    )
    .slice(0, rowsCount);

  useEffect(() => {
    const loadMore = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop + 1500 >
        document.scrollingElement.scrollHeight
      ) {
        setRowsCount((prevRowsCount) =>
          Math.min(prevRowsCount + 30, Object.keys(data.countries).length)
        );
      }
    };

    window.addEventListener("scroll", loadMore);

    return () => {
      window.removeEventListener("scroll", loadMore);
    };
  }, []);

  return (
    <Wrapper>
      <Table
        columns={columns}
        rows={rows}
        deltaPosition="bottom"
        stickyColumnIndex={[0, 1]}
      />
    </Wrapper>
  );
};

export const WorldCountrySectionSkeleton = () => {
  return <Wrapper css={{ height: rem(1605) }}></Wrapper>;
};

const Wrapper = styled(Section, {
  overflowX: "hidden",
  paddingY: rem(20),
});

export default WorldCountrySection;
