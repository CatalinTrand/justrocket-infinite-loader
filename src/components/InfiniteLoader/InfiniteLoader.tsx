import React, { useCallback, useRef, useState } from 'react';
import { InfiniteLoaderConfig, InfiniteLoaderProps, PageChunksData } from './types';

const DEFAULT_CONFIG: InfiniteLoaderConfig = {
  pageSize: 10,
  queryParamNames: {
    pageSize: 'pageSize',
    startIndex: 'startIndex',
  }
};

let pageChangeTimeout: any = null;

//this variable is declared here so that changes to it's value take effect immediately,
//compared to a setState action, that is asynchronous
let isFetching: boolean = false;

export const InfiniteLoader: React.FC<InfiniteLoaderProps> = ({ sourceUrl, ListItemComponent, config }) => {

  const { pageSize, queryParamNames } = config ?? DEFAULT_CONFIG;

  const [chunksData, setChunksData] = useState<PageChunksData>({});
  const [currentDisplayedPageIndex, setCurrentDisplayedPageIndex] = useState<number>(0);

  const [hasError, setHasError] = useState(false);

  //create dynamic reference to the limits of the list
  const observerFirst = useRef<any>();
  const observerLast = useRef<any>();

  //dynamic reference to the currently viewed chunk
  const viewedChunk = useRef<any>();

  const firstElementRef = useCallback( //monitor if first element was scrolled down to trigger viewed chunk change
    (node: React.ReactNode) => {
      if (observerFirst.current)
        observerFirst.current.disconnect();
      observerFirst.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          //debounce scroll events
          if (pageChangeTimeout)
            clearTimeout(pageChangeTimeout);
          let chunkHeight = viewedChunk.current.height;
          pageChangeTimeout = setTimeout(() => {
            setCurrentDisplayedPageIndex(oldIdx => oldIdx > 0 ? oldIdx - 1 : 0);
            setTimeout(() => {
              window.scrollBy({ top: chunkHeight });
            }, 50);
          }, 200);
        }
      });
      if (node)
        observerFirst.current.observe(node);
    },
    []
  );

  const lastElementRef = useCallback( //monitor if last element was scrolled up to trigger viewed chunk change
    (node: React.ReactNode) => {
      if (observerLast.current)
        observerLast.current.disconnect();
      observerLast.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          //debounce scroll events
          if (pageChangeTimeout)
            clearTimeout(pageChangeTimeout);
          let chunkHeight = viewedChunk.current.height;
          pageChangeTimeout = setTimeout(() => {
            setCurrentDisplayedPageIndex(oldIdx => oldIdx + 1);
            setTimeout(() => {
              window.scrollBy({ top: chunkHeight * -1 });
            }, 50);
          }, 200);
        }
      });
      if (node)
        observerLast.current.observe(node);
    },
    []
  );

  const fetchChunkData = async (chunkIdx: number) => { //fetch data from an api that supports pagination
    try {
      isFetching = true;
      let response = await fetch(
        `${sourceUrl}?${queryParamNames.startIndex}=${chunkIdx * pageSize}&${queryParamNames.pageSize}=${pageSize}`
      );
      isFetching = false;

      if (response)
        response = await response.json();

      if (Array.isArray(response)) {
        let copy = { ...chunksData };
        copy[chunkIdx] = response;
        setChunksData(copy);
      } else {
        console.log('ERROR - chunk fetch response is not an array; response received is:', response);
        setHasError(true);
      }
    } catch (err) {
      console.log(
        `ERROR - fetching/parsing data from ${sourceUrl} with config=${config ?? DEFAULT_CONFIG} and params pageNumber=${chunkIdx} and pageSize=${pageSize}:`
        , err);
      setHasError(true);
    } finally {
      isFetching = false;
    }
  };

  const renderPageChunk = (chunkIdx: number) => {
    let data = chunksData[chunkIdx] ?? [];

    if (data.length === 0 && chunkIdx >= 0) { //chunk info non-existent
      if (!isFetching)
        fetchChunkData(chunkIdx);
      return <h4>Loading...</h4>; //element indicating that data is being loaded
    }

    return data.map((item, idx) => <ListItemComponent key={`${chunkIdx}-${idx}`} {...item}/>);
  };

  //only render a chunk before the current chunk and one after it for smoothness of the scrolling
  //the chunks already fetched but which are out of view are not displayed for performance reasons
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: '1' }}>
      {hasError ?
        <p className={'err-text'}><b>!</b> An error occured. Please attempt a page refresh or see console for details
        </p> : null}
      <div key={`chunk-${currentDisplayedPageIndex - 1}`}>
        {renderPageChunk(currentDisplayedPageIndex - 1)}
      </div>
      <div ref={firstElementRef}/>
      <div key={`chunk-${currentDisplayedPageIndex}`} ref={viewedChunk}>
        {renderPageChunk(currentDisplayedPageIndex)}
      </div>
      <div key={`chunk-${currentDisplayedPageIndex + 1}`}>
        {renderPageChunk(currentDisplayedPageIndex + 1)}
      </div>
      <div ref={lastElementRef}/>
    </div>
  );
};
