<?php declare(strict_types=1);
/**
 * @author Daniel Garcia-Briseno <daniel.garciabriseno@nasa.gov>
 */


use PHPUnit\Framework\TestCase;

// File under test
include_once HV_ROOT_DIR.'/../src/Module/WebClient.php';
include_once HV_ROOT_DIR.'/../src/Helper/DateTimeConversions.php';

final class WebClientTest extends TestCase
{
    /**
     * One of the requests seen in the error log has a diffTime that sends the
     * difference back to year 803 BC. This ends up being sent to MySQL as a negative
     * date string and it can't handle that. A patch was made to clamp the date to
     * a minimum date set in the configuration file. This test verifies that works.
     *
     * @runInSeparateProcess
     */
    public function test_getTile_BadDiffTime(): void
    {
        // The bad layer data that has been observed in the logs
        $params = array(
          "action" => "getTile",
          "id" => "9894", // TODO: Get dynamically, any image id will work.
          "imageScale" => "1.21022044",
          "x" => "0",
          "y" => "-1",
          "difference" => "1",
          "diffCount" => "90000000000",
          "diffTime" => "0",
          "baseDiffTime" => "2012-03-10T23:36:32Z"
        );

        // Set up the client
        $client = new Module_WebClient($params);

        // Expect the result to say something like "No data before HV_MINIMUM_DATE"
        $date = new DateTime(HV_MINIMUM_DATE);
        $datestr = $date->format("Y-m-d\TH:i:s.000\Z");
        $this->expectOutputRegex("/No .+ data is available on or before " . $datestr . "/");

        $result = $client->execute();
    }
}
