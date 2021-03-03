## Resizable 可拖拽大小

可拖拽大小会在列表元素之间生成拖拽条，用户对拖拽条进行拖拽即可改变元素大小。

### 基本用法

展示列表元素为默认大小，用户可拖拽来进行改变。

::: demo `defaultSize`决定列表元素渲染的初始尺寸，`minSize`是元素的最小尺寸，`maxSize`是元素的最大尺寸。支持字符串表达式，诸如："100% - 40px"。百分比单位是基于Resizable.Wrapper来进行计算的。
```js
constructor(props) {
  super(props);
  this.state = { theme: 'light-bar' };
  this.handleChangeTheme = this.handleChangeTheme.bind(this);
}

handleChangeTheme() {
  const { theme } = this.state;
  if (theme === 'heavy-bar') {
    this.setState({ theme: 'light-bar' });
  } else {
    this.setState({ theme: 'heavy-bar' });
  }
}

render() {
  const { theme } = this.state;
  return (
    <div>
      <Button style={{ marginBottom: '20px' }} onClick={this.handleChangeTheme}>改变拖拽样式</Button>
      <div style={{ border: '1px solid red', height: '200px', marginBottom: '20px' }}>
        <Resizable.Wrapper alignment="horizontal" theme={theme}>
          <Resizable.Item defaultSize="30%" minSize="190px" style={{ background: 'rgba(19, 206, 102, .2)' }}>
            第一列
          </Resizable.Item>
          <Resizable.Item defaultSize="30%" minSize="190px" style={{ background: 'rgba(32, 160, 255, .2)' }}>
            第二列
          </Resizable.Item>
          <Resizable.Item defaultSize="40%" minSize="190px" style={{ background: 'rgba(247, 186, 42, .2)' }}>
            第三列
          </Resizable.Item>
        </Resizable.Wrapper>
      </div>
      <div style={{ border: '1px solid red', height: '100vh', width: '200px' }}>
        <Resizable.Wrapper alignment="vertical" theme={theme}>
          <Resizable.Item defaultSize="31%" minSize="190px" style={{ background: 'rgba(19, 206, 102, .2)' }}>
            第一行
          </Resizable.Item>
          <Resizable.Item defaultSize="30%" minSize="190px" style={{ background: 'rgba(32, 160, 255, .2)' }}>
            第二行
          </Resizable.Item>
          <Resizable.Item defaultSize="39%" minSize="190px" style={{ background: 'rgba(247, 186, 42, .2)' }}>
            第三行
          </Resizable.Item>
        </Resizable.Wrapper>
      </div>
    </div>
  )
}
```
:::


### Resizable.Wrapper Attributes
| 参数      | 说明    | 类型      | 可选值       | 默认值   |
|---------- |-------- |---------- |-------------  |-------- |
| alignment | 排序方式 | string | vertical, horizontal | horizontal |
| theme | 拖拽条的样式 | string | light-bar, heavy-bar | light-bar |

### Resizable.Item Attributes
| 参数      | 说明    | 类型      | 可选值       | 默认值   |
|---------- |-------- |---------- |-------------  |-------- |
| defaultSize | 初始渲染默认尺寸 | string | - (支持数学表达式，诸如：100% - 10px) | - |
| minSize | 拖拽的最小尺寸 | string | - (支持数学表达式，诸如：100% - 10px) | - |
| maxSize | 拖拽的最大尺寸 | string | - (支持数学表达式，诸如：100% - 10px) | - |

### Events
| 事件名称      | 说明    | 回调参数      |
|---------- |-------- |---------- |
| onResize | 拖拽时触发 | (event) |

