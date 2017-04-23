'use strict';

crop.factory('cropAreaCircle', ['cropArea', function(CropArea) {
  var CropAreaCircle = function() {
    CropArea.apply(this, arguments);

    this._boxResizeBaseSize = 20;
    this._boxResizeNormalRatio = 0.9;
    this._boxResizeHoverRatio = 1.2;
    this._iconMoveNormalRatio = 0.9;
    this._iconMoveHoverRatio = 1.2;

    this._boxResizeNormalSize = this._boxResizeBaseSize*this._boxResizeNormalRatio;
    this._boxResizeHoverSize = this._boxResizeBaseSize*this._boxResizeHoverRatio;

    this._posDragStartX=0;
    this._posDragStartY=0;
    this._posResizeStartX=0;
    this._posResizeStartY=0;
    this._posResizeStartSize=0;

    this._boxResizeIsHover = false;
    this._areaIsHover = false;
    this._boxResizeIsDragging = false;
    this._areaIsDragging = false;
  };

  CropAreaCircle.prototype = new CropArea();

  CropAreaCircle.prototype._calcCirclePerimeterCoords=function(angleDegrees) {
    var hSize=this._size/2;
    var angleRadians=angleDegrees * (Math.PI / 180),
        circlePerimeterX=this._x + hSize * Math.cos(angleRadians),
        circlePerimeterY=this._y + hSize * Math.sin(angleRadians);
    return [circlePerimeterX, circlePerimeterY];
  };

  CropAreaCircle.prototype._calcResizeIconCenterCoords=function() {
    return this._calcCirclePerimeterCoords(-45);
  };

  CropAreaCircle.prototype._isCoordWithinArea=function(coord) {
    return Math.sqrt((coord[0]-this._x)*(coord[0]-this._x) + (coord[1]-this._y)*(coord[1]-this._y)) < this._size/2;
  };
  CropAreaCircle.prototype._isCoordWithinBoxResize=function(coord) {
    var resizeIconCenterCoords=this._calcResizeIconCenterCoords();
    var hSize=this._boxResizeHoverSize/2;
    return(coord[0] > resizeIconCenterCoords[0] - hSize && coord[0] < resizeIconCenterCoords[0] + hSize &&
           coord[1] > resizeIconCenterCoords[1] - hSize && coord[1] < resizeIconCenterCoords[1] + hSize);
  };

  CropAreaCircle.prototype._drawArea=function(ctx,centerCoords,size){
    ctx.arc(centerCoords[0],centerCoords[1],size/2,0,2*Math.PI);
  };

  CropAreaCircle.prototype.draw=function() {
    CropArea.prototype.draw.apply(this, arguments);

    // draw move icon
    this._cropCanvas.drawIconMove([this._x,this._y], this._areaIsHover?this._iconMoveHoverRatio:this._iconMoveNormalRatio);

    // draw resize cubes
    this._cropCanvas.drawIconResizeBoxNESW(this._calcResizeIconCenterCoords(), this._boxResizeBaseSize, this._boxResizeIsHover?this._boxResizeHoverRatio:this._boxResizeNormalRatio);
  };

  CropAreaCircle.prototype.processMouseMove=function(mouseCurX, mouseCurY) {
    var cursor='default';
    var res=false;

    this._boxResizeIsHover = false;
    this._areaIsHover = false;

    if (this._areaIsDragging) {
      this._x = mouseCurX - this._posDragStartX;
      this._y = mouseCurY - this._posDragStartY;
      this._areaIsHover = true;
      cursor='move';
      res=true;
      this._events.trigger('area-move');
    } else if (this._boxResizeIsDragging) {
        cursor = 'nesw-resize';
        var iFR, iFX, iFY;
        iFX = mouseCurX - this._posResizeStartX;
        iFY = this._posResizeStartY - mouseCurY;
        if(iFX>iFY) {
          iFR = this._posResizeStartSize + iFY*2;
        } else {
          iFR = this._posResizeStartSize + iFX*2;
        }

        this._size = Math.max(this._minSize, iFR);
        this._boxResizeIsHover = true;
        res=true;
        this._events.trigger('area-resize');
    } else if (this._isCoordWithinBoxResize([mouseCurX,mouseCurY])) {
        cursor = 'nesw-resize';
        this._areaIsHover = false;
        this._boxResizeIsHover = true;
        res=true;
    } else if(this._isCoordWithinArea([mouseCurX,mouseCurY])) {
        cursor = 'move';
        this._areaIsHover = true;
        res=true;
    }

    this._dontDragOutside();
    angular.element(this._ctx.canvas).css({'cursor': cursor});

    return res;
  };

  CropAreaCircle.prototype.processMouseDown=function(mouseDownX, mouseDownY) {
    if (this._isCoordWithinBoxResize([mouseDownX,mouseDownY])) {
      this._areaIsDragging = false;
      this._areaIsHover = false;
      this._boxResizeIsDragging = true;
      this._boxResizeIsHover = true;
      this._posResizeStartX=mouseDownX;
      this._posResizeStartY=mouseDownY;
      this._posResizeStartSize = this._size;
      this._events.trigger('area-resize-start');
    } else if (this._isCoordWithinArea([mouseDownX,mouseDownY])) {
      this._areaIsDragging = true;
      this._areaIsHover = true;
      this._boxResizeIsDragging = false;
      this._boxResizeIsHover = false;
      this._posDragStartX = mouseDownX - this._x;
      this._posDragStartY = mouseDownY - this._y;
      this._events.trigger('area-move-start');
    }
  };

  CropAreaCircle.prototype.processMouseUp=function(/*mouseUpX, mouseUpY*/) {
    if(this._areaIsDragging) {
      this._areaIsDragging = false;
      this._events.trigger('area-move-end');
    }
    if(this._boxResizeIsDragging) {
      this._boxResizeIsDragging = false;
      this._events.trigger('area-resize-end');
    }
    this._areaIsHover = false;
    this._boxResizeIsHover = false;

    this._posDragStartX = 0;
    this._posDragStartY = 0;
  };


  return CropAreaCircle;
}]);

