import 'package:openapi_generator_annotations/openapi_generator_annotations.dart';

@Openapi(
    additionalProperties:
    AdditionalProperties(pubName: 'nt_server_api', pubAuthor: 'Noita Together'),
    inputSpecFile: '../openapi.yaml',
    generatorName: Generator.dart,
    outputDirectory: 'api/nt_server_api')
class NTApi extends OpenapiGeneratorConfig {}