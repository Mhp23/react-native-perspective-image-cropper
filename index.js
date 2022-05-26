import React, {Component} from 'react';
import {
  NativeModules,
  PanResponder,
  Dimensions,
  Image,
  View,
  Animated,
  StyleSheet,
} from 'react-native';
import Svg, {Polygon} from 'react-native-svg';

const {width} = Dimensions.get('window');

const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

const LineWidth = 2;
const ScaleFactor = 8;
const ViewSizeFactor = 0.6;
const ZoomViewSize = width * ViewSizeFactor;

class CustomCrop extends Component {
  constructor(props) {
    super(props);
    this.state = {
      viewHeight: width * (props.height / props.width),
      height: props.height,
      width: props.width,
      image: props.initialImage,
      marginTop: 100,
      marginLeft: 100,
      changeSide: {
        topLeft: false,
        topRight: false,
        bottomLeft: false,
        bottomRight: false,
      },
      moving: false,
    };

    this.state = {
      ...this.state,
      topLeft: new Animated.ValueXY(
        props.rectangleCoordinates
          ? this.imageCoordinatesToViewCoordinates(
              props.rectangleCoordinates.topLeft,
              true,
            )
          : {x: 100, y: 100},
      ),
      topRight: new Animated.ValueXY(
        props.rectangleCoordinates
          ? this.imageCoordinatesToViewCoordinates(
              props.rectangleCoordinates.topRight,
              true,
            )
          : {x: width - 100, y: 100},
      ),
      bottomLeft: new Animated.ValueXY(
        props.rectangleCoordinates
          ? this.imageCoordinatesToViewCoordinates(
              props.rectangleCoordinates.bottomLeft,
              true,
            )
          : {x: 100, y: this.state.viewHeight - 100},
      ),
      bottomRight: new Animated.ValueXY(
        props.rectangleCoordinates
          ? this.imageCoordinatesToViewCoordinates(
              props.rectangleCoordinates.bottomRight,
              true,
            )
          : {
              x: width - 100,
              y: this.state.viewHeight - 100,
            },
      ),
    };
    this.state = {
      ...this.state,
      overlayPositions: `${this.state.topLeft.x._value},${this.state.topLeft.y._value} ${this.state.topRight.x._value},${this.state.topRight.y._value} ${this.state.bottomRight.x._value},${this.state.bottomRight.y._value} ${this.state.bottomLeft.x._value},${this.state.bottomLeft.y._value}`,
    };

    this.panResponderTopLeft = this.createPanResponser(
      this.state.topLeft,
      'topLeft',
    );
    this.panResponderTopRight = this.createPanResponser(
      this.state.topRight,
      'topRight',
    );
    this.panResponderBottomLeft = this.createPanResponser(
      this.state.bottomLeft,
      'bottomLeft',
    );
    this.panResponderBottomRight = this.createPanResponser(
      this.state.bottomRight,
      'bottomRight',
    );
  }

  createPanResponser(corner, changedDirection) {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        Animated.event([
          null,
          {
            dx: corner.x,
            dy: corner.y,
          },
        ])(evt, gestureState);
        this.updateOverlayString(changedDirection);
      },
      onPanResponderRelease: () => {
        corner.flattenOffset();
        this.updateOverlayString(changedDirection);
      },
      onPanResponderGrant: () => {
        corner.setOffset({x: corner.x._value, y: corner.y._value});
        corner.setValue({x: 0, y: 0});
      },
      onPanResponderEnd: () => this._onTouchEnd(),
      onPanResponderStart: () => this._onTouchStart(),
    });
  }

  crop() {
    const coordinates = {
      topLeft: this.viewCoordinatesToImageCoordinates(this.state.topLeft),
      topRight: this.viewCoordinatesToImageCoordinates(this.state.topRight),
      bottomLeft: this.viewCoordinatesToImageCoordinates(this.state.bottomLeft),
      bottomRight: this.viewCoordinatesToImageCoordinates(
        this.state.bottomRight,
      ),
      height: this.state.height,
      width: this.state.width,
    };
    NativeModules.CustomCropManager.crop(
      coordinates,
      this.state.image,
      (_err, res) => this.props.updateImage(res.image, coordinates),
    );
  }

  updateOverlayString(changedDirection) {
    switch (changedDirection) {
      case 'topLeft':
        this.setState({
          changeSide: {
            topLeft: true,
            topRight: false,
            bottomLeft: false,
            bottomRight: false,
          },
        });
        break;
      case 'topRight':
        this.setState({
          changeSide: {
            topLeft: false,
            topRight: true,
            bottomLeft: false,
            bottomRight: false,
          },
        });
        break;
      case 'bottomLeft':
        this.setState({
          changeSide: {
            topLeft: false,
            topRight: false,
            bottomLeft: true,
            bottomRight: false,
          },
        });
        break;
      case 'bottomRight':
        this.setState({
          changeSide: {
            topLeft: false,
            topRight: false,
            bottomLeft: false,
            bottomRight: true,
          },
        });
        break;
    }

    let topLeftx = this.state.topLeft.x._value + this.state.topLeft.x._offset;
    let topLefty = this.state.topLeft.y._value + this.state.topLeft.y._offset;

    let topRightx =
      this.state.topRight.x._value + this.state.topRight.x._offset;
    let topRighty =
      this.state.topRight.y._value + this.state.topRight.y._offset;

    let bottomRightx =
      this.state.bottomRight.x._value + this.state.bottomRight.x._offset;
    let bottomRighty =
      this.state.bottomRight.y._value + this.state.bottomRight.y._offset;

    let bottomLeftx =
      this.state.bottomLeft.x._value + this.state.bottomLeft.x._offset;
    let bottomLefty =
      this.state.bottomLeft.y._value + this.state.bottomLeft.y._offset;

    let marginTop, marginLeft;

    if (this.state.changeSide.topLeft) {
      marginTop = topLefty;
      marginLeft = topLeftx;
    } else if (this.state.changeSide.topRight) {
      marginTop = topRighty;
      marginLeft = topRightx;
    } else if (this.state.changeSide.bottomLeft) {
      marginTop = bottomLefty;
      marginLeft = bottomLeftx;
    } else {
      marginTop = bottomRighty;
      marginLeft = bottomRightx;
    }

    if (marginTop <= this.state.viewHeight) {
      this.setState({
        marginTop,
        marginLeft,
        overlayPositions: `${topLeftx},${topLefty} ${topRightx},${topRighty} ${bottomRightx},${bottomRighty} ${bottomLeftx},${bottomLefty}`,
      });
    }
  }

  imageCoordinatesToViewCoordinates(corner) {
    return {
      x: (corner.x * width) / this.state.width,
      y: (corner.y * this.state.viewHeight) / this.state.height,
    };
  }

  viewCoordinatesToImageCoordinates(corner) {
    return {
      x: (corner.x._value / width) * this.state.width,
      y: (corner.y._value / this.state.viewHeight) * this.state.height,
    };
  }

  _onTouchStart() {
    this.setState({moving: true});
  }

  _onTouchEnd() {
    this.setState({moving: false});
  }

  render() {
    return (
      <View style={styles.container}>
        <View
          style={[
            s(this.props).cropContainer,
            {height: this.state.viewHeight},
          ]}>
          <Image
            style={[s(this.props).image, {height: this.state.viewHeight}]}
            resizeMode="contain"
            source={{uri: this.state.image}}
          />
          <Svg height={this.state.viewHeight} width={width} style={styles.svg}>
            <AnimatedPolygon
              ref={ref => (this.polygon = ref)}
              fill={this.props.overlayColor || 'blue'}
              fillOpacity={this.props.overlayOpacity || 0.5}
              stroke={this.props.overlayStrokeColor || 'blue'}
              points={this.state.overlayPositions}
              strokeWidth={this.props.overlayStrokeWidth || 3}
            />
          </Svg>
          <Animated.View
            {...this.panResponderTopLeft.panHandlers}
            style={[this.state.topLeft.getLayout(), s(this.props).handler]}>
            <View style={[s(this.props).handlerI, styles.topLeftBase]} />
            <View style={[s(this.props).handlerRound, styles.topLeftRound]} />
          </Animated.View>
          <Animated.View
            {...this.panResponderTopRight.panHandlers}
            style={[this.state.topRight.getLayout(), s(this.props).handler]}>
            <View style={[s(this.props).handlerI, styles.topRightBase]} />
            <View style={[s(this.props).handlerRound, styles.topRightRound]} />
          </Animated.View>
          <Animated.View
            {...this.panResponderBottomLeft.panHandlers}
            style={[this.state.bottomLeft.getLayout(), s(this.props).handler]}>
            <View style={[s(this.props).handlerI, styles.bottomLeftBase]} />
            <View
              style={[s(this.props).handlerRound, styles.bottomLeftRound]}
            />
          </Animated.View>
          <Animated.View
            {...this.panResponderBottomRight.panHandlers}
            style={[this.state.bottomRight.getLayout(), s(this.props).handler]}>
            <View style={[s(this.props).handlerI, styles.bottomRightBase]} />
            <View
              style={[s(this.props).handlerRound, styles.bottomRightRound]}
            />
          </Animated.View>
          {this.state.moving && (
            <Animated.View
              style={[
                styles.zoomView,
                {
                  width: ZoomViewSize,
                  height: ZoomViewSize,
                  top:
                    this.state.viewHeight +
                    this.state.viewHeight * (1 - ViewSizeFactor),
                  marginLeft: width * ((1 - ViewSizeFactor) / 2),
                },
              ]}>
              <Image
                resizeMode="contain"
                source={{uri: this.state.image}}
                style={{
                  width: width * ScaleFactor,
                  height: this.state.viewHeight * ScaleFactor,
                  marginTop:
                    -1 * (this.state.marginTop * ScaleFactor) +
                    ZoomViewSize / 2,
                  marginLeft:
                    -1 * (this.state.marginLeft * ScaleFactor) +
                    ZoomViewSize / 2,
                }}
              />
              <View
                style={[
                  styles.hLine,
                  {backgroundColor: this.props.overlayStrokeColor},
                ]}
              />
              <View
                style={[
                  styles.vLine,
                  {backgroundColor: this.props.overlayStrokeColor},
                ]}
              />
            </Animated.View>
          )}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  svg: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  topLeftBase: {
    left: -10,
    top: -10,
  },
  topLeftRound: {
    left: 31,
    top: 31,
  },
  topRightBase: {
    left: 10,
    top: -10,
  },
  topRightRound: {
    right: 31,
    top: 31,
  },
  bottomLeftBase: {
    left: -10,
    top: 10,
  },
  bottomLeftRound: {
    left: 31,
    bottom: 31,
  },
  bottomRightBase: {
    left: 10,
    top: 10,
  },
  bottomRightRound: {
    right: 31,
    bottom: 31,
  },
  zoomView: {
    zIndex: 3,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'absolute',
    borderColor: '#000000',
    borderRadius: ZoomViewSize,
  },
  vLine: {
    top: 0,
    zIndex: 2,
    width: LineWidth,
    height: ZoomViewSize,
    position: 'absolute',
    left: ZoomViewSize / 2 - LineWidth,
  },
  hLine: {
    left: 0,
    zIndex: 3,
    height: LineWidth,
    width: ZoomViewSize,
    position: 'absolute',
    top: ZoomViewSize / 2 - LineWidth,
  },
});

const s = props => ({
  handlerI: {
    borderRadius: 0,
    height: 20,
    width: 20,
    backgroundColor: props.handlerColor || 'blue',
  },
  handlerRound: {
    width: 39,
    position: 'absolute',
    height: 39,
    borderRadius: 100,
    backgroundColor: props.handlerColor || 'blue',
  },
  image: {
    width: width,
    position: 'absolute',
  },
  bottomButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'blue',
    width: 70,
    height: 70,
    borderRadius: 100,
  },
  handler: {
    height: 140,
    width: 140,
    overflow: 'visible',
    marginLeft: -70,
    marginTop: -70,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  cropContainer: {
    position: 'absolute',
    left: 0,
    width: width,
    top: 0,
  },
});

export default CustomCrop;
