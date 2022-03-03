import React from 'react';

export interface InfiniteLoaderProps {
  sourceUrl: string,
  ListItemComponent: React.ComponentType, // how an individual element of the list is rendered
  config?: InfiniteLoaderConfig,
}

export interface InfiniteLoaderConfig {
  pageSize: number, //equivalent to chunk size
  queryParamNames: { //the param names to be used in the query to the API when fetching the list
    // the index of the element from which to begin the list fetch
    // initially I used pageIndex but typicode.com API used for this example required startingIndex and not pageIndex
    startIndex: string,
    pageSize: string,
  }
}

export interface PageChunksData {
  [key: number]: any[],
}
