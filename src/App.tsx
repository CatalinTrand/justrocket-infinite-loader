import * as React from 'react';
import { useMemo } from 'react';
import { InfiniteLoader } from './components/InfiniteLoader/InfiniteLoader';
import { InfiniteLoaderConfig } from './components/InfiniteLoader/types';

//free online api for testing
const url = 'https://jsonplaceholder.typicode.com/todos';

const ListItem: React.FC = (props: any) => (
  <div className={'list-item-root'}>
    <div className={'list-item-left'}>
      <h4>Item ID #{props.id}</h4>
      <h4>Is completed? {props.completed ? 'Yes' : 'No'}</h4>
    </div>
    <h4 className={'list-item-title'}>{props.title}</h4>
  </div>
);

function App() {

  const config: InfiniteLoaderConfig = useMemo(() => ({
    pageSize: 10,
    queryParamNames: {
      pageSize: '_limit',
      startIndex: '_start',
    }
  }), []);

  return (
    <div className={'page-root'}>
      <h3>Infinite loader example - TODOs list fetched from <i>typicode.com</i></h3>
      <InfiniteLoader sourceUrl={url} ListItemComponent={ListItem} config={config}/>
    </div>
  );
}

export default App;
