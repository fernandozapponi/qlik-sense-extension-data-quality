/*globals define*/

define( ["qlik", "jquery", "text!./style.css"], function ( qlik, $, cssContent ) {

	'use strict';
	$( "<style>" ).html( cssContent ).appendTo( "head" );
	
	var app = qlik.currApp();
	var dimensoes = [];

	function createRows ( rows, dimensionInfo ) {
		
		var html = "";
		rows.forEach( function ( row ) {
			html += '<tr>';
			row.forEach( function ( cell, key ) {
				if ( cell.qIsOtherCell ) {
					cell.qText = dimensionInfo[key].othersLabel;
				}
				html += "<td ";
				if ( !isNaN( cell.qNum ) ) {
					html += "class='numeric'";
				}
				html += '>' + cell.qText + '</td>';
			} );
			html += '</tr>';
		} );

		return html;
	}

	function getDimensions(){
		//console.log('Carregando dimensões');

		// console.log('dimensoes',dimensoes);

		// var retorno = Array.from(dimensoes);
		// var retorno = JSON.parse(dimensoes);
		var retorno = dimensoes;
		// var retorno = [{qDef:{qFieldDefs:["Bancos.FCXA_CODCXA"]}}];
		console.log('retorno',retorno);
		return retorno;
	}

	function getExpressions(){
		//console.log('Carregando expressões');
		var retorno = {qDef : {qLabel:'Valor',         qDef : 'sum([$Rows])'}};
		//console.log(retorno);
		return retorno;
	}

	app.createCube({
            qDimensions       : [ 
                                  {qDef:{qFieldDefs:['$Field']}}
                                ],
            qInitialDataFetch : [{
                                  qTop : 0,            /* Posição da linha no cubo */ 
                                  qLeft : 0,                                /* Qtd. de colunas a serem eliminadas da esquerda para a direita. */ 
                                  qHeight : 20,              /* Qtd. registros por página */ 
                                  qWidth : 1 //expressao   /* Qtd. de colunas visíveis (dimensões + expressões). Se menor que o cubo elimina da direita para a esquerda. */
                                }]
        }, function(reply) {

        	// console.log('reply', reply);

        	if((reply.qHyperCube.qDataPages).length>0){
				
        		// console.table(reply.qHyperCube.qDataPages[0].qMatrix);

				// CONCATENAR OS VALORES DAS DIMENSÕES E EXPRESSÕES.
                $.each(reply.qHyperCube.qDataPages[0].qMatrix, function(key, value) {
				  	
				  	var nomeCampo = value[0].qText;
				  	var ret = {};
				  	
				  	// console.log('key', key);
				  	// console.log('value', value);
				  	// console.log('nomeCampo', nomeCampo);

				  // 	if(dimensoes!=''){
						// dimensoes += ', ';
				  // 	}
					// dimensoes += '{qDef:{qFieldDefs:["'+ nomeCampo +'"]}}';
					dimensoes.push(JSON.parse('{"qDef":{"qFieldDefs":["'+nomeCampo+'"]}}'));
				});
    			
    		}

    });

	return {
		initialProperties: {
			qHyperCubeDef: {
				qDimensions: getDimensions(),
				qMeasures: [getExpressions()],
				qInitialDataFetch: [{
					qWidth: 10,
					qHeight: 50
				}]
			}
		},
		// definition: {
		// 	type: "items",
		// 	component: "accordion",
		// 	items: {
		// 		dimensions: {
		// 			uses: "dimensions",
		// 			min: 1
		// 		},
		// 		measures: {
		// 			uses: "measures",
		// 			min: 0
		// 		},
		// 		sorting: {
		// 			uses: "sorting"
		// 		},
		// 		settings: {
		// 			uses: "settings"
		// 		}
		// 	}
		// },
		snapshot: {
			canTakeSnapshot: true
		},
		paint: function ( $element, layout ) {

			// console.log('$element',$element);
			// console.log('layout',layout);

			var html = "<table><thead><tr>", self = this,
				morebutton = false,
				hypercube = layout.qHyperCube,
				rowcount = hypercube.qDataPages[0].qMatrix.length,
				colcount = hypercube.qDimensionInfo.length + hypercube.qMeasureInfo.length;
			
				console.log('hypercube',hypercube);

			//render titles
			hypercube.qDimensionInfo.forEach( function ( cell ) {
				html += '<th>' + cell.qFallbackTitle + '</th>';
			} );

			hypercube.qMeasureInfo.forEach( function ( cell ) {
				html += '<th>' + cell.qFallbackTitle + '</th>';
			} );

			html += "</tr></thead>";
			
			html += "<tbody>";
			
				//render data
				html += createRows( hypercube.qDataPages[0].qMatrix, hypercube.qDimensionInfo );
			
			html += "</tbody>";
			html += "</table>";
			
			//add 'more...' button
			if ( hypercube.qSize.qcy > rowcount ) {
				html += "<button class='more'>More...</button>";
				morebutton = true;
			}
			$element.html( html );
			if ( morebutton ) {
				$element.find( ".more" ).on( "click", function () {
					var requestPage = [{
						qTop: rowcount,
						qLeft: 0,
						qWidth: colcount,
						qHeight: Math.min( 50, hypercube.qSize.qcy - rowcount )
					}];
					self.backendApi.getData( requestPage ).then( function ( dataPages ) {
						rowcount += dataPages[0].qMatrix.length;
						if ( rowcount >= hypercube.qSize.qcy ) {
							$element.find( ".more" ).hide();
						}
						var html = createRows( dataPages[0].qMatrix, hypercube.qDimensionInfo );
						$element.find( "tbody" ).append( html );
					} );
				} );
			}
			return qlik.Promise.resolve();

		}
	};
} );
