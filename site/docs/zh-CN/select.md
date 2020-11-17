当选项过多时，使用下拉菜单展示并选择内容。

### 基础用法

适用广泛的基础单选

:::demo `value`的值为当前被选中的`Option`的 value 属性值
```js
constructor(props) {
  super(props);

  this.state = {
    options: [{
      value: '选项1',
      label: '黄金糕'
    }, {
      value: '选项2',
      label: '双皮奶'
    }, {
      value: '选项3',
      label: '蚵仔煎'
    }, {
      value: '选项4',
      label: '龙须面'
    }, {
      value: '选项5',
      label: '北京烤鸭'
    }],
    value1: '',
    value2: '选项1',
  };
  this.handleInput = this.handleInput.bind(this);
}

handleInput(key, value) {
  this.setState({ [key]: value });
  console.log(value);
}

render() {
  const { value1, value2, options } = this.state;
  return (
    <div>
      <Select
        value={value1}
        placeholder="请选择"
        onChange={value => this.handleInput('value1', value)}
      >
        {options.map(el => (
          <Select.Option key={el.value} label={el.label} value={el.value} />
        ))}
      </Select>
      <Select
        size="small"
        value={value2}
        placeholder="请选择"
        onChange={value => this.handleInput('value2', value)}
        popperProps={{
          modifiers: {
            flip: { enabled: false },
          },
        }}
      >
        {options.map(el => (
          <Select.Option key={el.value} label={el.label} value={el.value} />
        ))}
      </Select>
    </div>
  )
}
```
:::

### 有禁用选项

:::demo 在`Option`中，设定`disabled`值为 true，即可禁用该选项
```js
constructor(props) {
  super(props);

  this.state = {
    options: [{
      value: '选项1',
      label: '黄金糕'
    }, {
      value: '选项2',
      label: '双皮奶',
      disabled: true
    }, {
      value: '选项3',
      label: '蚵仔煎'
    }, {
      value: '选项4',
      label: '龙须面'
    }, {
      value: '选项5',
      label: '北京烤鸭'
    }],
    value: ''
  };
  this.handleInput = this.handleInput.bind(this);
}

handleInput(value) {
  this.setState({ value });
  console.log(value);
}

render() {
  const { value, options } = this.state;
  return (
    <Select value={value} onChange={this.handleInput}>
      {options.map(el => (
        <Select.Option key={el.value} label={el.label} value={el.value} disabled={el.disabled} />
      ))}
    </Select>
  )
}
```
:::

### 有隐藏选项

:::demo 在`Option`中，设定`hidden`值为 true，即可隐藏该选项，隐藏项不支持
```js
constructor(props) {
  super(props);

  this.state = {
    options: [{
      value: '选项1',
      label: '黄金糕',
      hidden: true
    }, {
      value: '选项2',
      label: '双皮奶',
      hidden: true
    }, {
      value: '选项3',
      label: '蚵仔煎',
    }, {
      value: '选项4',
      label: '龙须面',
    }, {
      value: '选项5',
      label: '北京烤鸭',
    }],
    value: '选项1'
  };
  this.handleInput = this.handleInput.bind(this);
}

handleInput(value) {
  this.setState({ value });
  console.log(value);
}

render() {
  return (
    <Select value={this.state.value} onChange={this.handleInput} filterable>
      {
        this.state.options.map(el => {
          return <Select.Option key={el.value} label={el.label} value={el.value} hidden={el.hidden} />
        })
      }
    </Select>
  )
}
```
:::


### 禁用状态

选择器不可用状态

:::demo 为`Select`设置`disabled`属性，则整个选择器不可用
```js
constructor(props) {
  super(props);

  this.state = {
    options: [{
      value: '选项1',
      label: '黄金糕'
    }, {
      value: '选项2',
      label: '双皮奶'
    }, {
      value: '选项3',
      label: '蚵仔煎'
    }, {
      value: '选项4',
      label: '龙须面'
    }, {
      value: '选项5',
      label: '北京烤鸭'
    }],
    value1: '',
    value2: '选项1'
  };
  this.handleInput = this.handleInput.bind(this);
}

handleInput(key, value) {
  this.setState({ [key]: value });
  console.log(value);
}

render() {
  const { value1, value2, options } = this.state;
  return (
    <div>
      <Select disabled value={value1} onChange={value => this.handleInput('value1', value)}>
        {options.map(el => (
          <Select.Option key={el.value} label={el.label} value={el.value} />
        ))}
      </Select>
      <Select disabled value={value2} onChange={value => this.handleInput('value2', value)}>
        {options.map(el => (
          <Select.Option key={el.value} label={el.label} value={el.value} />
        ))}
      </Select>
    </div>
  )
}
```
:::

### 可清空单选

包含清空按钮，可将选择器清空为初始状态

:::demo 为`Select`设置`clearable`属性，则可将选择器清空。需要注意的是，`clearable`属性仅适用于单选。
```js
constructor(props) {
  super(props);

  this.state = {
    options: [{
      value: '选项1',
      label: '黄金糕'
    }, {
      value: '选项2',
      label: '双皮奶'
    }, {
      value: '选项3',
      label: '蚵仔煎'
    }, {
      value: '选项4',
      label: '龙须面'
    }, {
      value: '选项5',
      label: '北京烤鸭'
    }],
    value: ''
  };
  this.handleInput = this.handleInput.bind(this);
}

handleInput(value) {
  this.setState({ value });
  console.log(value);
}

render() {
  const { value, options } = this.state;
  return (
    <Select value={value} clearable={true} onChange={this.handleInput}>
      {options.map(el => (
        <Select.Option key={el.value} label={el.label} value={el.value} />
      ))}
    </Select>
  )
}
```
:::

### 基础多选

适用性较广的基础多选，用 Tag 展示已选项

:::demo 为`Select`设置`multiple`属性即可启用多选，此时`value`的值为当前选中值所组成的数组
```js
constructor(props) {
  super(props);

  this.state = {
    options: [{
      value: '选项1',
      label: '黄金糕'
    }, {
      value: '选项2',
      label: '双皮奶'
    }, {
      value: '选项3',
      label: '蚵仔煎'
    }, {
      value: '选项4',
      label: '龙须面'
    }, {
      value: '选项5',
      label: '北京烤鸭'
    }],
    value: []
  };
  this.handleInput = this.handleInput.bind(this);
}

handleInput(value) {
  this.setState({ value });
  console.log(value);
}

render() {
  return (
    <Select value={this.state.value} multiple={true} onChange={this.handleInput}>
      {
        this.state.options.map(el => {
          return <Select.Option key={el.value} label={el.label} value={el.value} icon="el-icon-time" onIconClick={() => console.log(el.value)} />
        })
      }
    </Select>
  )
}
```
:::

### 自定义模板

可以自定义备选项

:::demo 将自定义的 HTML 模板插入`Option`中即可。
```js
constructor(props) {
  super(props);

  this.state = {
    cities: [{
      value: 'Beijing',
      label: '北京'
    }, {
      value: 'Shanghai',
      label: '上海'
    }, {
      value: 'Nanjing',
      label: '南京'
    }, {
      value: 'Chengdu',
      label: '成都'
    }, {
      value: 'Shenzhen',
      label: '深圳'
    }, {
      value: 'Guangzhou',
      label: '广州'
    }],
    value: []
  };
  this.handleInput = this.handleInput.bind(this);
}

handleInput(value) {
  this.setState({ value });
  console.log(value);
}

render() {
  return (
    <Select value={this.state.value} onChange={this.handleInput}>
      {
        this.state.cities.map(el => {
          return (
            <Select.Option key={el.value} label={el.label} value={el.value}>
              <span style={{float: 'left'}}>{el.label}</span>
              <span style={{float: 'right', color: '#8492a6', fontSize: 13}}>{el.value}</span>
            </Select.Option>
          )
        })
      }
    </Select>
  )
}
```
:::

### 分组

备选项进行分组展示

:::demo 使用`OptionGroup`对备选项进行分组，它的`label`属性为分组名
```js
constructor(props) {
  super(props);

  this.state = {
    options: [{
      label: '热门城市',
      options: [{
        value: 'Shanghai',
        label: '上海'
      }, {
        value: 'Beijing',
        label: '北京'
      }]
    }, {
      label: '城市名',
      options: [{
        value: 'Chengdu',
        label: '成都'
      }, {
        value: 'Shenzhen',
        label: '深圳'
      }, {
        value: 'Guangzhou',
        label: '广州'
      }, {
        value: 'Dalian',
        label: '大连'
      }]
    }],
    value: ''
  };
  this.handleInput = this.handleInput.bind(this);
}

handleInput(value) {
  this.setState({ value });
  console.log(value);
}

render() {
  return (
    <Select value={this.state.value} onChange={this.handleInput}>
      {
        this.state.options.map(group => {
          return (
            <Select.OptionGroup key={group.label} label={group.label}>
              {
                group.options.map(el => {
                  return (
                    <Select.Option key={el.value} label={el.label} value={el.value}>
                      <span style={{float: 'left'}}>{el.label}</span>
                      <span style={{float: 'right', color: '#8492a6', fontSize: 13}}>{el.value}</span>
                    </Select.Option>
                  )
                })
              }
            </Select.OptionGroup>
          )
        })
      }
    </Select>
  )
}
```
:::

### 可搜索

可以利用搜索功能快速查找选项

:::demo 为`Select`添加`filterable`属性即可启用搜索功能。默认情况下，Select 会找出所有`label`属性包含输入值的选项。如果希望使用其他的搜索逻辑，可以通过传入一个`filterMethod`来实现。`filterMethod`为一个`Function`，它会在输入值发生变化时调用，参数为当前输入值。
```js
constructor(props) {
  super(props);

  this.state = {
    options: [{
      value: '选项1',
      label: '黄金糕'
    }, {
      value: '选项2',
      label: '双皮奶'
    }, {
      value: '选项3',
      label: '蚵仔煎'
    }, {
      value: '选项4',
      label: '龙须面'
    }, {
      value: '选项5',
      label: '北京烤鸭'
    }],
    value: {
      multiple: [],
      multiple1: ["选项1", "选项2"],
      single: "",
      single1: "选项1",
    },
  };
}

handleInput(inputName, inputValue) {
  const { value } = this.state;
  this.setState({ value: Object.assign({}, value, { [inputName]: inputValue }) });
  console.log(inputValue);
}

render() {
  const { value, options } = this.state;
  return (
    <div>
      <div>
        <Select filterable multiple value={value.multiple} onChange={value => this.handleInput('multiple', value)}>
          {options.map(el => (
            <Select.Option key={el.value} label={el.label} value={el.value} />
          ))}
        </Select>
        <Select filterable multiple value={value.multiple1} onChange={value => this.handleInput('multiple1', value)}>
          {options.map(el => (
            <Select.Option key={el.value} label={el.label} value={el.value} />
          ))}
        </Select>
      </div>
      <div>
        <Select filterable value={value.single} onChange={value => this.handleInput('single', value)}>
          {options.map(el => (
            <Select.Option key={el.value} label={el.label} value={el.value} />
          ))}
        </Select>
        <Select filterable value={value.single1} onChange={value => this.handleInput('single1', value)}>
          {options.map(el => (
            <Select.Option key={el.value} label={el.label} value={el.value} />
          ))}
        </Select>
      </div>
    </div>
  )
}
```
:::

### 远程搜索

从服务器搜索数据，输入关键字进行查找

:::demo 为了启用远程搜索，需要将`filterable`和`remote`设置为`true`，同时传入一个`remoteMethod`。`remoteMethod`为一个`Function`，它会在输入值发生变化时调用，参数为当前输入值。
```js
constructor(props) {
  super(props);

  this.state = {
    value: {
      multiple: [],
      multiple1: ["Alabama", "Alaska"],
      single: "",
      single1: "Alabama",
      showOptionsAfterFilter: "",
      showOptionsAfterFilter1: "Alabama",
    },
    options: {
      multiple: [],
      multiple1: [],
      single: [],
      single1: [],
      showOptionsAfterFilter: [],
      showOptionsAfterFilter1: [],
    },
    loading: {
      multiple: false,
      multiple1: false,
      single: false,
      single1: false,
      showOptionsAfterFilter: false,
      showOptionsAfterFilter1: false,
    },
    isShowMenu: false,
    states: ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",   "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"]
  };
}

get allOptions () {
  const { states } = this.state;
  return states.map(item => ({ value: item, label: item }));
}

handleInput(inputName, inputValue) {
  const { value } = this.state;
  this.setState({ value: Object.assign({}, value, { [inputName]: inputValue }) });
  console.log(inputValue);
}

handleLoading(inputName, inputValue) {
  const { loading } = this.state;
  this.setState({ loading: Object.assign({}, loading, { [inputName]: inputValue }) });
}

handleOptions(inputName, inputValue) {
  const { options } = this.state;
  this.setState({ options: Object.assign({}, options, { [inputName]: inputValue }) });
}

onSearch(inputName, query) {
  this.handleLoading(inputName, true);

  return new Promise(resolve => {
    setTimeout(() => {
      const { states, isShowMenu } = this.state;
      const options = this.allOptions.filter(item => (
        item.label.toLowerCase().indexOf(query.toLowerCase()) > -1
      ));
      this.handleLoading(inputName, false);
      this.handleOptions(inputName, options);

      if (query) {
        this.setState({ isShowMenu: true });
      } else {
        this.setState({ isShowMenu: false });
      }
      resolve();
    }, 200);
  });
}

render() {
  const { value, options, loading, isShowMenu } = this.state;
  return (
    <div>
      <div>
        <Select
          remote
          multiple
          filterable
          name="multiple"
          isShowMenu={isShowMenu}
          value={value.multiple}
          loading={loading.multiple}
          onChange={value => this.handleInput('multiple', value)}
          remoteMethod={value => this.onSearch('multiple', value)}
        >
          {options.multiple.map(el => (
            <Select.Option key={el.value} label={el.label} value={el.value} />
          ))}
        </Select>
        <Select
          remote
          multiple
          filterable
          size="small"
          name="multiple1"
          value={value.multiple1}
          loading={loading.multiple1}
          onChange={value => this.handleInput('multiple1', value)}
          remoteMethod={value => this.onSearch('multiple1', value)}
        >
          {options.multiple1.map(el => (
            <Select.Option key={el.value} label={el.label} value={el.value} />
          ))}
        </Select>
      </div>
      <div>
        <Select
          remote
          filterable
          name="single"
          value={value.single}
          loading={loading.single}
          onChange={value => this.handleInput('single', value)}
          remoteMethod={value => this.onSearch('single', value)}
        >
          {options.single.map(el => (
            <Select.Option key={el.value} label={el.label} value={el.value} />
          ))}
        </Select>
        <Select
          remote
          filterable
          size="small"
          name="single1"
          value={value.single1}
          loading={loading.single1}
          onChange={value => this.handleInput('single1', value)}
          remoteMethod={value => this.onSearch('single1', value)}
        >
          {options.single1.map(el => (
            <Select.Option key={el.value} label={el.label} value={el.value} />
          ))}
        </Select>
      </div>
      <div>
        <Select
          remote
          filterable
          isShowOptionsAfterFilter
          name="showOptionsAfterFilter"
          value={value.showOptionsAfterFilter}
          loading={loading.showOptionsAfterFilter}
          onChange={value => this.handleInput('showOptionsAfterFilter', value)}
          remoteMethod={value => this.onSearch('showOptionsAfterFilter', value)}
        >
          {options.showOptionsAfterFilter.map(el => (
            <Select.Option key={el.value} label={el.label} value={el.value} />
          ))}
        </Select>
        <Select
          remote
          filterable
          isShowOptionsAfterFilter
          size="small"
          name="showOptionsAfterFilter1"
          value={value.showOptionsAfterFilter1}
          loading={loading.showOptionsAfterFilter1}
          onChange={value => this.handleInput('showOptionsAfterFilter1', value)}
          remoteMethod={value => this.onSearch('showOptionsAfterFilter1', value)}
        >
          {options.showOptionsAfterFilter1.map(el => (
            <Select.Option key={el.value} label={el.label} value={el.value} />
          ))}
        </Select>
      </div>
    </div>
  )
}
```
:::

### 穿越overflow

防止外层元素的overflow

:::demo 为`Select`添加`filterable`属性即可启用搜索功能。默认情况下，Select 会找出所有`label`属性包含输入值的选项。如果希望使用其他的搜索逻辑，可以通过传入一个`filterMethod`来实现。`filterMethod`为一个`Function`，它会在输入值发生变化时调用，参数为当前输入值。
```js
constructor(props) {
  super(props);

  this.state = {
    options: [{
      value: '选项1',
      label: '黄金糕黄金糕黄金糕黄金糕黄金糕黄金糕黄金糕黄金糕黄金糕黄金糕黄金糕'
    }, {
      value: '选项2',
      label: '双皮奶双皮奶双皮奶双皮奶双皮奶双皮奶双皮奶双皮奶双皮奶双皮奶双皮奶'
    }, {
      value: '选项3',
      label: '北京烤鸭北京烤鸭北京烤鸭北京烤鸭北京烤鸭北京烤鸭北京烤鸭北京烤鸭'
    }],
    value: []
  };
  this.handleInput = this.handleInput.bind(this);
}

handleInput(value) {
  this.setState({ value });
  console.log(value);
}

render() {
  const style = {
    width: '300px',
    height: '200px',
    overflow: 'auto',
    border: '1px solid red',
  }
  return (
    <div style={style}>
    <Select value={this.state.value} positionFixed={true} filterable={true} multiple={true} onChange={this.handleInput}>
      {
        this.state.options.map(el => {
          return <Select.Option key={el.value} label={el.label} value={el.value} />
        })
      }
    </Select>
    </div>
  )
}
```
:::


### WarningMsg 显示提示信息

输入a进行搜索

:::demo 为`Select`添加`WarningMsg`属性即可启用提示信息功能。

```js
constructor(props) {
  super(props);

  this.state = {
    value: [],
    options: [],
    states: ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",   "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas",
    "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"]
  };
  this.handleInput = this.handleInput.bind(this);
}

handleInput(value) {
  this.setState({ value });
  console.log(value);
}

onSearch(query) {
  if (query !== '') {
    this.setState({
      loading: true
    });

    setTimeout(() => {
      this.setState({
        loading: false,
        options: this.state.states.map(item => {
          return { value: item, label: item };
        }).filter(item => {
          return item.label.toLowerCase().indexOf(query.toLowerCase()) > -1;
        })
      });
    }, 200);
  } else {
    this.setState({
      options: []
    });
  }
}

render() {
  return (
    <Select value={this.state.value} multiple={true} positionFixed={true} filterable={true} remote={true} remoteMethod={this.onSearch.bind(this)} loading={this.state.loading} onChange={this.handleInput} warningMsg="Up to 200 values returned, please search for all.">
      {
        this.state.options.map(el => {
          return <Select.Option key={el.value} label={el.label} value={el.value} />
        })
      }
    </Select>
  )
}
```
:::

### 懒加载下拉框

在下拉框选项数量较大的时候，一次性渲染出所有的选项对于浏览器负担太重，所以引入前端懒加载来解决大数据渲染的问题。

:::demo `isLazy`属性设置为`true`即可。
```js
constructor(props) {
  super(props);

  this.state = {
    single: {
      options: [],
      value: '',
    },
    single1: {
      options: [],
      value: '选项2',
    },
    multiple: {
      options: [],
      value: '',
    },
    multiple1: {
      options: [],
      value: ['选项2', '选项3'],
    }
  };
  this.allOptions = [];

  for (let i = 0; i < 20; i += 1) {
    this.state.single.options.push({ label: `选项${i}`, value: `选项${i}` });
    this.state.single1.options.push({ label: `选项${i}`, value: `选项${i}` });
    this.state.multiple.options.push({ label: `选项${i}`, value: `选项${i}` });
    this.state.multiple1.options.push({ label: `选项${i}`, value: `选项${i}` });
    this.allOptions.push({ label: `选项${i}`, value: `选项${i}` });
  }

  this.handleSingleInput = this.handleSingleInput.bind(this);
  this.handleSingle1Input = this.handleSingle1Input.bind(this);
  this.handleSingleFilter = this.handleSingleFilter.bind(this);
  this.handleMultipleInput = this.handleMultipleInput.bind(this);
  this.handleMultiple1Input = this.handleMultiple1Input.bind(this);
  this.handleMultipleFilter = this.handleMultipleFilter.bind(this);
}

handleSingleInput(value) {
  const { single: oldSingle } = this.state;
  this.setState({
    single: Object.assign({}, oldSingle, { value })
  });
}

handleSingle1Input(value) {
  const { single1: oldSingle1 } = this.state;
  this.setState({
    single1: Object.assign({}, oldSingle1, { value })
  });
}

handleMultipleInput(value) {
  const { multiple: oldMultiple } = this.state;
  this.setState({
    multiple: Object.assign({}, oldMultiple, { value })
  });
}

handleMultiple1Input(value) {
  const { multiple1: oldMultiple1 } = this.state;
  this.setState({
    multiple1: Object.assign({}, oldMultiple1, { value })
  });
}

handleSingleFilter(query) {
  const { single: oldSingle } = this.state;
  const options = this.allOptions
    .filter(option => option.label.toLowerCase().includes(query.toLowerCase()));
  this.setState({
    single: Object.assign({}, oldSingle, { options })
  });
}

handleMultipleFilter(query) {
  const { multiple: oldMultiple } = this.state;
  const options = this.allOptions
    .filter(option => option.label.toLowerCase().includes(query.toLowerCase()));
  this.setState({
    multiple: Object.assign({}, oldMultiple, { options })
  });
}

render() {
  const { single, single1, multiple, multiple1 } = this.state;
  return (
    <div>
      <div>
        <Select
          isLazy
          filterable
          value={single.value}
          placeholder="请选择"
          onChange={this.handleSingleInput}
        >
          {single.options.map((el, idx) => (
            <Select.Option key={el.value} label={el.label} value={el.value} />
          ))}
        </Select>
        <Select
          isLazy
          filterable
          value={single1.value}
          placeholder="请选择"
          onChange={this.handleSingle1Input}
        >
          {single1.options.map((el, idx) => (
            <Select.Option key={el.value} label={el.label} value={el.value} />
          ))}
        </Select>
      </div>
      <div>
        <Select
          isLazy
          multiple
          filterable
          value={multiple.value}
          placeholder="请选择"
          onChange={this.handleMultipleInput}
        >
          {multiple.options.map(el => (
            <Select.Option key={el.value} label={el.label} value={el.value} />
          ))}
        </Select>
        <Select
          isLazy
          multiple
          filterable
          value={multiple1.value}
          placeholder="请选择"
          onChange={this.handleMultiple1Input}
        >
          {multiple1.options.map(el => (
            <Select.Option key={el.value} label={el.label} value={el.value} />
          ))}
        </Select>
      </div>
    </div>
  )
}
```
:::

### Select Attributes
| 参数      | 说明          | 类型      | 可选值                           | 默认值  |
|---------- |-------------- |---------- |--------------------------------  |-------- |
| multiple | 是否多选 | boolean | — | false |
| disabled | 是否禁用 | boolean | — | false |
| clearable | 单选时是否可以清空选项 | boolean | — | false |
| name | select input 的 name 属性 | string | — | — |
| placeholder | 占位符 | string | — | 请选择 |
| filterable | 是否可搜索 | boolean | — | false |
| filterMethod | 自定义过滤方法 | function | — | — |
| remote | 是否为远程搜索 | boolean | — | false |
| remoteMethod | 远程搜索方法 | function | — | — |
| loading | 是否正在从远程获取数据 | boolean | — | false |
| prefixIcon | 前缀图标 | string | — | - |
| showOverflowTooltip | 文字溢出是否展示tooltip，在自定义模板中不支持该功能。 | boolean | — | false |
| popperProps | 弹出下拉属性设置，详情见[popper.js](https://popper.js.org/docs/v1/) | object | - | — |
| isShowOptionsAfterFilter | 是否在过滤框输入之后，再弹出下拉选项 | boolean | - | — |

### Select Events
| 事件名称 | 说明 | 回调参数 |
|---------|---------|---------|
| onChange | 选中值发生变化时触发 | 目前的选中值 |
| onVisibleChange | 下拉框出现/隐藏时触发 | 出现则为 true，隐藏则为 false |
| onRemoveTag | 多选模式下移除tag时触发 | 移除的tag值 |
| onClear | 可清空的单选模式下用户点击清空按钮时触发 | - |

### Option Group Attributes
| 参数      | 说明          | 类型      | 可选值                           | 默认值  |
|---------- |-------------- |---------- |--------------------------------  |-------- |
| label | 分组的组名 | string | — | — |
| disabled | 是否将该分组下所有选项置为禁用 | boolean | — | false |

### Option Attributes
| 参数      | 说明          | 类型      | 可选值                           | 默认值  |
|---------- |-------------- |---------- |--------------------------------  |-------- |
| value | 选项的值 | string/number/object | — | — |
| label | 选项的标签，若不设置则默认与 `value` 相同 | string/number | — | — |
| disabled | 是否禁用该选项 | boolean | — | false |
| icon | Tag的前缀icon(多选生效) | string | — | - |
| onIconClick | Tag的前缀icon点击事件(多选生效) | function | — | - |
